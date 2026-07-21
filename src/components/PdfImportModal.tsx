import React, { useState } from 'react';
import { Concept } from '../types';
import { X, Upload, FileText, Sparkles, Check, AlertCircle, RefreshCw, Layers } from 'lucide-react';

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
  const [isLoading, setIsLoading] = useState(false);
  const [extractedConcepts, setExtractedConcepts] = useState<any[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== 'application/pdf' && !file.name.endsWith('.pdf')) {
        setErrorMsg('Por favor selecciona un archivo PDF válido.');
        return;
      }
      setPdfFile(file);
      setErrorMsg(null);

      const reader = new FileReader();
      reader.onload = () => {
        setPdfBase64(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleExtract = async () => {
    if (!pasteText.trim() && !pdfBase64) {
      setErrorMsg('Ingresa texto de estudio o sube un archivo PDF.');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);

    try {
      const existingTerms = existingConcepts.map(c => c.term);

      const response = await fetch('/api/extract-concepts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: pasteText,
          pdfBase64,
          existingTerms,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'No se pudieron extraer conceptos.');
      }

      setExtractedConcepts(data.concepts || []);
    } catch (err: any) {
      console.error('PDF Extraction error:', err);
      setErrorMsg(err.message || 'Error al procesar el material de estudio con IA.');
    } finally {
      setIsLoading(false);
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
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="bg-white rounded-3xl border border-neutral-200 shadow-2xl max-w-2xl w-full p-6 sm:p-8 space-y-6 relative my-8">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          id="close-pdf-modal-btn"
          className="absolute top-6 right-6 p-2 rounded-full hover:bg-neutral-100 text-neutral-400 hover:text-neutral-700 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-2xl">
            📄
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-neutral-900">Extracción Inteligente de PDFs & Apuntes</h2>
            <p className="text-xs text-neutral-500">Carga tu programa de estudios y la IA extraerá conceptos, ejemplos y detectará duplicados.</p>
          </div>
        </div>

        {extractedConcepts.length === 0 ? (
          <div className="space-y-4">
            
            {/* PDF Upload Dropzone */}
            <div className="p-6 border-2 border-dashed border-neutral-200 rounded-3xl bg-neutral-50/50 hover:bg-indigo-50/30 hover:border-indigo-300 transition-all text-center space-y-3">
              <Upload className="w-8 h-8 text-indigo-500 mx-auto" />
              <div>
                <p className="text-xs font-bold text-neutral-800">
                  {pdfFile ? `PDF Seleccionado: ${pdfFile.name}` : 'Arrastra o selecciona un archivo PDF de estudio'}
                </p>
                <p className="text-[11px] text-neutral-400 mt-1">Soporta programas universitarios, PDFs de clases y resúmenes.</p>
              </div>

              <input
                type="file"
                id="pdf-file-input"
                accept="application/pdf"
                onChange={handleFileChange}
                className="hidden"
              />
              <label
                htmlFor="pdf-file-input"
                className="inline-block px-4 py-2 rounded-xl bg-white border border-neutral-200 text-neutral-800 font-bold text-xs shadow-sm hover:bg-neutral-100 transition cursor-pointer"
              >
                {pdfFile ? 'Cambiar PDF' : 'Seleccionar PDF local'}
              </label>
            </div>

            <div className="flex items-center gap-3 text-xs text-neutral-400">
              <div className="h-px bg-neutral-200 flex-1" />
              <span>O pega tu texto aquí abajo</span>
              <div className="h-px bg-neutral-200 flex-1" />
            </div>

            {/* Textarea Paste */}
            <div>
              <textarea
                rows={4}
                id="paste-text-input"
                value={pasteText}
                onChange={(e) => setUserText(e.target.value)}
                placeholder="Pega aquí el capítulo del libro, diapositivas o notas de la materia..."
                className="w-full p-4 rounded-2xl border border-neutral-200 text-xs text-neutral-900 focus:outline-none focus:ring-2 focus:ring-indigo-400 transition"
              />
            </div>

            {errorMsg && (
              <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-800 font-medium flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <button
              onClick={handleExtract}
              disabled={isLoading || (!pasteText.trim() && !pdfBase64)}
              id="extract-concepts-btn"
              className={`w-full py-3.5 rounded-2xl font-bold text-xs tracking-wide transition shadow-lg flex items-center justify-center gap-2 ${
                (pasteText.trim() || pdfBase64) && !isLoading
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
                  <span>Extraer Conceptos e Integrar</span>
                </>
              )}
            </button>
          </div>
        ) : (
          /* REVIEW EXTRACTED CONCEPTS & DUPLICATES */
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 font-medium">
              ✨ Se han extraído <strong>{extractedConcepts.length} conceptos clave</strong> agrupados por grandes temas.
            </div>

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
                className="px-4 py-2.5 rounded-xl border border-neutral-200 text-xs font-bold text-neutral-700 hover:bg-neutral-50 transition"
              >
                Volver
              </button>

              <button
                onClick={handleConfirmImport}
                id="confirm-import-btn"
                className="px-6 py-2.5 rounded-xl bg-neutral-900 text-white font-bold text-xs shadow hover:bg-neutral-800 transition flex items-center gap-2"
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
