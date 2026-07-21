import React, { useState } from 'react';
import { Concept } from '../types';
import { X, Upload, FileText, Sparkles, Check, AlertCircle, RefreshCw, Layers, CheckCircle2 } from 'lucide-react';
import { getPdfMetadata, splitPdfIntoChunks, PdfChunkInfo } from '../lib/pdfUtils';

interface PdfImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  existingConcepts: Concept[];
  onImportConcepts: (newConcepts: Concept[]) => void;
}

export const PdfImportModal: React.FC<PdfImportModalProps> = ({
  isOpen,
  onClose,
  existingConcepts,
  onImportConcepts,
}) => {
  const [pasteText, setUserText] = useState('');
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfBase64, setPdfBase64] = useState<string | null>(null);
  const [pdfPageCount, setPdfPageCount] = useState<number | null>(null);
  const [pdfSizeMB, setPdfSizeMB] = useState<number | null>(null);

  // Loading & Progress states
  const [isLoading, setIsLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [progressPercent, setProgressPercent] = useState<number>(0);
  const [progressMessage, setProgressMessage] = useState<string>('');
  const [currentChunkInfo, setCurrentChunkInfo] = useState<{ current: number; total: number; pages: string } | null>(null);

  const [extractedConcepts, setExtractedConcepts] = useState<any[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [warningMsg, setWarningMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const MAX_FILE_SIZE_MB = 20;

  const processFile = async (file: File) => {
    setErrorMsg(null);
    setWarningMsg(null);

    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      setErrorMsg('Por favor selecciona un archivo con formato PDF válido (.pdf).');
      return;
    }

    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > MAX_FILE_SIZE_MB) {
      setErrorMsg(
        `El archivo mide ${fileSizeMB.toFixed(1)} MB y supera el límite permitido de 20 MB. Por favor comprime el documento PDF o pega el texto directamente.`
      );
      return;
    }

    try {
      setPdfFile(file);
      setPdfSizeMB(fileSizeMB);

      // Extract metadata (page count) using pdf-lib
      const metadata = await getPdfMetadata(file);
      setPdfPageCount(metadata.pageCount);

      // Read base64 for single-chunk fallback
      const reader = new FileReader();
      reader.onload = () => {
        setPdfBase64(reader.result as string);
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      console.error('Error reading PDF metadata:', err);
      // Fallback if pdf-lib metadata read fails
      setPdfPageCount(null);
      const reader = new FileReader();
      reader.onload = () => {
        setPdfBase64(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
  };

  const handleRemovePdf = () => {
    setPdfFile(null);
    setPdfBase64(null);
    setPdfPageCount(null);
    setPdfSizeMB(null);
    setErrorMsg(null);
    setWarningMsg(null);
  };

  const handleExtract = async () => {
    if (!pasteText.trim() && !pdfFile && !pdfBase64) {
      setErrorMsg('Ingresa texto de estudio o selecciona un archivo PDF.');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);
    setWarningMsg(null);
    setProgressPercent(5);
    setProgressMessage('Iniciando lectura y análisis del documento...');
    setCurrentChunkInfo(null);

    const existingTerms = existingConcepts.map((c) => c.term);
    const accumulatedConcepts: any[] = [];
    const seenTermsSet = new Set<string>();

    try {
      if (pdfFile) {
        // Step 1: Divide PDF into chunks if multipage or large
        setProgressPercent(15);
        setProgressMessage(`Leyendo estructura del PDF (${pdfPageCount || 'varias'} páginas)...`);

        let chunks: PdfChunkInfo[] = [];

        try {
          // If PDF is > 6 pages or > 2 MB, split into 6-page chunks for resilience and fast Gemini execution
          if ((pdfPageCount && pdfPageCount > 6) || (pdfSizeMB && pdfSizeMB > 2)) {
            setProgressMessage('Dividiendo PDF en fragmentos optimizados para el procesamiento de IA...');
            chunks = await splitPdfIntoChunks(pdfFile, 6);
          } else if (pdfBase64) {
            chunks = [
              {
                chunkIndex: 1,
                totalChunks: 1,
                startPage: 1,
                endPage: pdfPageCount || 1,
                totalPages: pdfPageCount || 1,
                pdfBase64: pdfBase64,
              },
            ];
          }
        } catch (splitErr) {
          console.warn('PDF splitting warning, falling back to full file base64:', splitErr);
          if (pdfBase64) {
            chunks = [
              {
                chunkIndex: 1,
                totalChunks: 1,
                startPage: 1,
                endPage: pdfPageCount || 1,
                totalPages: pdfPageCount || 1,
                pdfBase64: pdfBase64,
              },
            ];
          }
        }

        if (chunks.length === 0 && pdfBase64) {
          chunks = [
            {
              chunkIndex: 1,
              totalChunks: 1,
              startPage: 1,
              endPage: pdfPageCount || 1,
              totalPages: pdfPageCount || 1,
              pdfBase64: pdfBase64,
            },
          ];
        }

        let chunkErrorsCount = 0;

        // Step 2: Process each chunk
        for (let i = 0; i < chunks.length; i++) {
          const chunk = chunks[i];
          const pct = Math.min(25 + Math.round(((i + 1) / chunks.length) * 65), 90);
          setProgressPercent(pct);
          setCurrentChunkInfo({
            current: chunk.chunkIndex,
            total: chunk.totalChunks,
            pages: `páginas ${chunk.startPage}-${chunk.endPage} de ${chunk.totalPages}`,
          });
          setProgressMessage(
            chunks.length > 1
              ? `Analizando fragmento ${chunk.chunkIndex} de ${chunk.totalChunks} (${chunk.startPage}-${chunk.endPage} pág.) con IA Gemini...`
              : `Analizando documento PDF (${chunk.totalPages} pág.) con IA Gemini...`
          );

          try {
            const response = await fetch('/api/extract-concepts', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                text: i === 0 ? pasteText : '', // Pass extra text with first chunk
                pdfBase64: chunk.pdfBase64,
                existingTerms: [...existingTerms, ...Array.from(seenTermsSet)],
              }),
            });

            const data = await response.json();

            if (!response.ok || !data.success) {
              chunkErrorsCount++;
              console.warn(`Chunk ${chunk.chunkIndex} API warning:`, data?.error);
              continue;
            }

            if (data.concepts && Array.isArray(data.concepts)) {
              for (const concept of data.concepts) {
                const normalizedTerm = (concept.term || '').trim().toLowerCase();
                if (normalizedTerm && !seenTermsSet.has(normalizedTerm)) {
                  seenTermsSet.add(normalizedTerm);
                  accumulatedConcepts.push(concept);
                }
              }
            }
          } catch (chunkErr) {
            chunkErrorsCount++;
            console.error(`Error processing chunk ${chunk.chunkIndex}:`, chunkErr);
          }
        }

        if (accumulatedConcepts.length === 0) {
          throw new Error(
            'No se pudieron extraer conceptos del PDF. Asegúrate de que el documento no sea un archivo escaneado sin texto seleccionable o intenta pegar el texto directamente.'
          );
        }

        if (chunkErrorsCount > 0 && accumulatedConcepts.length > 0) {
          setWarningMsg(
            `Procesamiento completado con éxito parcial. Se extrajeron ${accumulatedConcepts.length} conceptos de las páginas procesadas.`
          );
        }
      } else if (pasteText.trim()) {
        // Text only processing
        setProgressPercent(40);
        setProgressMessage('Procesando texto de estudio con la IA de Gemini...');

        const response = await fetch('/api/extract-concepts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: pasteText,
            existingTerms,
          }),
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.error || 'No se pudieron extraer conceptos del texto provisto.');
        }

        if (data.concepts && Array.isArray(data.concepts)) {
          accumulatedConcepts.push(...data.concepts);
        }
      }

      setProgressPercent(100);
      setProgressMessage('¡Conceptos sintetizados y listos para revisar!');

      if (accumulatedConcepts.length === 0) {
        throw new Error('No se identificaron conceptos relevantes en el material.');
      }

      setExtractedConcepts(accumulatedConcepts);
    } catch (err: any) {
      console.error('PDF Extraction error:', err);
      setErrorMsg(err.message || 'Ocurrió un error al procesar el material de estudio. Por favor intenta nuevamente.');
    } finally {
      setIsLoading(false);
      setCurrentChunkInfo(null);
    }
  };

  const handleConfirmImport = () => {
    const newItems: Concept[] = extractedConcepts.map((item, idx) => ({
      id: `custom-${Date.now()}-${idx}`,
      topic: item.topic || 'Marketing Digital',
      term: item.term,
      simpleDefinition: item.simpleDefinition,
      practicalExample: item.practicalExample,
      emoji: item.emoji || '📌',
      difficulty: item.difficulty || 'medio',
      synonyms: item.synonyms || [],
      masteryLevel: 20, // Initial low mastery for new concept
      lastReviewed: null,
      nextReviewDate: new Date().toISOString(),
      reviewIntervalDays: 1,
      timesCorrect: 0,
      timesIncorrect: 0,
      keyTakeaway: item.keyTakeaway,
    }));

    onImportConcepts(newItems);
    onClose();
    setExtractedConcepts([]);
    setUserText('');
    setPdfFile(null);
    setPdfBase64(null);
    setPdfPageCount(null);
    setPdfSizeMB(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="bg-white rounded-3xl border border-neutral-200 shadow-2xl max-w-2xl w-full p-6 sm:p-8 space-y-6 relative my-8">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          id="close-pdf-modal-btn"
          disabled={isLoading}
          className="absolute top-6 right-6 p-2 rounded-full hover:bg-neutral-100 text-neutral-400 hover:text-neutral-700 transition cursor-pointer disabled:opacity-50"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-2xl shadow-sm">
            📄
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-neutral-900">Extracción Inteligente de PDFs & Apuntes</h2>
            <p className="text-xs text-neutral-500">Carga tu programa de estudios en PDF (hasta 20 MB) o copia tus apuntes para crear tus tarjetas con IA.</p>
          </div>
        </div>

        {extractedConcepts.length === 0 ? (
          <div className="space-y-4">
            
            {/* PDF Upload Dropzone */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`p-6 border-2 border-dashed rounded-3xl transition-all text-center space-y-3 relative ${
                isDragging
                  ? 'border-indigo-500 bg-indigo-50/60 scale-[1.01]'
                  : pdfFile
                  ? 'border-emerald-300 bg-emerald-50/40'
                  : 'border-neutral-200 bg-neutral-50/50 hover:bg-indigo-50/30 hover:border-indigo-300'
              }`}
            >
              {pdfFile ? (
                <div className="bg-white p-4 rounded-2xl border border-emerald-200 shadow-sm max-w-md mx-auto space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 text-left overflow-hidden">
                      <FileText className="w-8 h-8 text-emerald-600 flex-shrink-0" />
                      <div className="truncate">
                        <p className="text-xs font-extrabold text-neutral-800 truncate">{pdfFile.name}</p>
                        <p className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1 mt-0.5">
                          <span>{pdfSizeMB ? `${pdfSizeMB.toFixed(1)} MB` : ''}</span>
                          {pdfPageCount !== null && (
                            <>
                              <span>•</span>
                              <span className="bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded font-bold">
                                {pdfPageCount} {pdfPageCount === 1 ? 'página' : 'páginas'}
                              </span>
                            </>
                          )}
                        </p>
                      </div>
                    </div>
                    {!isLoading && (
                      <button
                        onClick={handleRemovePdf}
                        type="button"
                        title="Eliminar PDF seleccionado"
                        className="p-1.5 rounded-lg text-neutral-400 hover:text-rose-600 hover:bg-rose-50 transition ml-2 flex-shrink-0 cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {pdfPageCount !== null && pdfPageCount > 6 && (
                    <div className="text-[10px] text-indigo-700 bg-indigo-50 p-2 rounded-xl flex items-center gap-1.5 font-medium text-left">
                      <Layers className="w-3.5 h-3.5 text-indigo-600 flex-shrink-0" />
                      <span>Documento extenso ({pdfPageCount} páginas). Se dividirá automáticamente en fragmentos para optimizar la IA.</span>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <Upload className={`w-8 h-8 mx-auto transition ${isDragging ? 'text-indigo-600 animate-bounce' : 'text-indigo-500'}`} />
                  <div>
                    <p className="text-xs font-bold text-neutral-800">
                      {isDragging ? '¡Suelta tu archivo PDF aquí!' : 'Arrastra tu archivo PDF o haz clic para seleccionarlo'}
                    </p>
                    <p className="text-[11px] text-neutral-400 mt-1">
                      Archivos PDF de hasta <strong className="text-neutral-700">20 MB</strong> (programas universitarios, libros, resúmenes).
                    </p>
                  </div>

                  <input
                    type="file"
                    id="pdf-file-input"
                    accept="application/pdf,.pdf"
                    onChange={handleFileChange}
                    disabled={isLoading}
                    className="hidden"
                  />
                  <label
                    htmlFor="pdf-file-input"
                    className="inline-block px-4 py-2 rounded-xl bg-white border border-neutral-200 text-neutral-800 font-bold text-xs shadow-sm hover:bg-neutral-100 transition cursor-pointer"
                  >
                    Seleccionar PDF local
                  </label>
                </>
              )}
            </div>

            <div className="flex items-center gap-3 text-xs text-neutral-400">
              <div className="h-px bg-neutral-200 flex-1" />
              <span>O también puedes pegar texto directamente</span>
              <div className="h-px bg-neutral-200 flex-1" />
            </div>

            {/* Textarea Paste */}
            <div>
              <textarea
                rows={3}
                id="paste-text-input"
                value={pasteText}
                disabled={isLoading}
                onChange={(e) => setUserText(e.target.value)}
                placeholder="Pega aquí anotaciones adicionales, capítulos o texto de apoyo..."
                className="w-full p-4 rounded-2xl border border-neutral-200 text-xs text-neutral-900 focus:outline-none focus:ring-2 focus:ring-indigo-400 transition"
              />
            </div>

            {errorMsg && (
              <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-800 font-medium flex items-start gap-2.5 animate-shake">
                <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-bold">Atención</p>
                  <p className="text-[11px] text-rose-700 leading-relaxed">{errorMsg}</p>
                </div>
              </div>
            )}

            {/* PROGRESS BAR DISPLAY WHEN PROCESSING */}
            {isLoading && (
              <div className="p-4 rounded-2xl bg-indigo-50/80 border border-indigo-200 space-y-3 animate-fade-in">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 font-bold text-indigo-900">
                    <RefreshCw className="w-4 h-4 text-indigo-600 animate-spin" />
                    <span>{progressMessage}</span>
                  </div>
                  <span className="font-extrabold text-indigo-700">{progressPercent}%</span>
                </div>

                {/* Animated Progress Bar */}
                <div className="w-full h-2.5 bg-indigo-100 rounded-full overflow-hidden p-0.5">
                  <div
                    className="h-full bg-gradient-to-r from-indigo-500 via-indigo-600 to-purple-600 rounded-full transition-all duration-300 shadow-sm"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>

                {currentChunkInfo && (
                  <div className="flex items-center justify-between text-[11px] text-indigo-700 font-medium pt-1">
                    <span>Procesando {currentChunkInfo.pages}</span>
                    <span className="font-bold bg-indigo-100 px-2 py-0.5 rounded-md">
                      Fragmento {currentChunkInfo.current} de {currentChunkInfo.total}
                    </span>
                  </div>
                )}
              </div>
            )}

            <button
              onClick={handleExtract}
              disabled={isLoading || (!pasteText.trim() && !pdfBase64 && !pdfFile)}
              id="extract-concepts-btn"
              className={`w-full py-3.5 rounded-2xl font-bold text-xs tracking-wide transition shadow-lg flex items-center justify-center gap-2 ${
                (pasteText.trim() || pdfBase64 || pdfFile) && !isLoading
                  ? 'bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer shadow-indigo-200'
                  : 'bg-neutral-200 text-neutral-400 cursor-not-allowed'
              }`}
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-white" />
                  <span>Procesando PDF e identificando conceptos con IA...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>
                    Extraer Conceptos {pdfPageCount ? `(${pdfPageCount} pág.)` : ''} e Integrar
                  </span>
                </>
              )}
            </button>
          </div>
        ) : (
          /* REVIEW EXTRACTED CONCEPTS & DUPLICATES */
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 font-medium space-y-1">
              <div className="flex items-center gap-2 font-bold text-emerald-800">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Extracción completada con éxito</span>
              </div>
              <p className="text-[11px] text-emerald-700">
                Se han extraído <strong>{extractedConcepts.length} conceptos clave</strong> estructurados y clasificados desde tu documento.
              </p>
            </div>

            {warningMsg && (
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800 font-medium flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                <span>{warningMsg}</span>
              </div>
            )}

            <div className="max-h-80 overflow-y-auto space-y-3 pr-2 border border-neutral-200 rounded-2xl p-3">
              {extractedConcepts.map((item, i) => (
                <div key={i} className="p-3.5 rounded-xl bg-neutral-50 border border-neutral-200 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-neutral-900 text-sm">
                      {item.emoji} {item.term}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-100 text-indigo-800">
                      {item.topic}
                    </span>
                  </div>

                  <p className="text-neutral-700">
                    "{item.simpleDefinition}"
                  </p>

                  <p className="text-neutral-500 italic">
                    <strong>Ejemplo:</strong> {item.practicalExample}
                  </p>

                  {item.duplicatesWithExisting && (
                    <div className="text-[11px] text-amber-800 font-bold bg-amber-100 p-2 rounded-lg flex items-center gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                      Concepto equivalente detectado con "{item.duplicatesWithExisting}". Se actualizarán sinónimos.
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setExtractedConcepts([])}
                id="back-to-paste-btn"
                className="px-4 py-2.5 rounded-xl border border-neutral-200 text-xs font-bold text-neutral-700 hover:bg-neutral-50 transition cursor-pointer"
              >
                Volver
              </button>

              <button
                onClick={handleConfirmImport}
                id="confirm-import-btn"
                className="px-6 py-2.5 rounded-xl bg-neutral-900 text-white font-bold text-xs shadow hover:bg-neutral-800 transition flex items-center gap-2 cursor-pointer"
              >
                <Check className="w-4 h-4 text-emerald-400" />
                Añadir al Mazo de Estudio ({extractedConcepts.length})
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

