import React, { useState } from 'react';
import { Concept, Difficulty } from '../types';
import { TOPIC_GROUPS } from '../data/defaultConcepts';
import { Search, Plus, Trash2, Edit2, AlertCircle, Sparkles, Filter } from 'lucide-react';

interface ConceptManagerProps {
  concepts: Concept[];
  onAddConcept: (concept: Concept) => void;
  onOpenPdfModal: () => void;
}

export const ConceptManager: React.FC<ConceptManagerProps> = ({
  concepts,
  onAddConcept,
  onOpenPdfModal,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTopic, setSelectedTopic] = useState<string>('all');
  const [isAddFormOpen, setIsAddFormOpen] = useState(false);

  // Form state for manual concept creation
  const [term, setTerm] = useState('');
  const [topic, setTopic] = useState(TOPIC_GROUPS[0].name);
  const [simpleDefinition, setSimpleDefinition] = useState('');
  const [practicalExample, setPracticalExample] = useState('');
  const [emoji, setEmoji] = useState('💡');
  const [difficulty, setDifficulty] = useState<Difficulty>('medio');

  const filteredConcepts = concepts.filter(c => {
    const matchesSearch = c.term.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.simpleDefinition.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.practicalExample.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTopic = selectedTopic === 'all' || c.topic === selectedTopic;
    return matchesSearch && matchesTopic;
  });

  const handleCreateConcept = (e: React.FormEvent) => {
    e.preventDefault();
    if (!term.trim() || !simpleDefinition.trim()) return;

    const newConcept: Concept = {
      id: `manual-${Date.now()}`,
      topic,
      term,
      simpleDefinition,
      practicalExample,
      emoji: emoji || '💡',
      difficulty,
      masteryLevel: 30,
      lastReviewed: null,
      nextReviewDate: new Date().toISOString(),
      reviewIntervalDays: 1,
      timesCorrect: 0,
      timesIncorrect: 0,
    };

    onAddConcept(newConcept);
    setIsAddFormOpen(false);
    setTerm('');
    setSimpleDefinition('');
    setPracticalExample('');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-neutral-200 shadow-sm">
        <div>
          <h2 className="text-xl font-extrabold text-neutral-900 tracking-tight">Glosario de Conceptos</h2>
          <p className="text-xs text-neutral-500">Gestión organizada de todos los términos de Marketing y Negocios Digitales</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenPdfModal}
            id="glossary-import-pdf-btn"
            className="px-4 py-2.5 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-700 font-bold text-xs hover:bg-indigo-100 transition"
          >
            + Importar PDF
          </button>

          <button
            onClick={() => setIsAddFormOpen(!isAddFormOpen)}
            id="glossary-add-manual-btn"
            className="px-4 py-2.5 rounded-2xl bg-neutral-900 text-white font-bold text-xs shadow hover:bg-neutral-800 transition flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            Nuevo Concepto
          </button>
        </div>
      </div>

      {/* MANUAL CONCEPT CREATION FORM */}
      {isAddFormOpen && (
        <form onSubmit={handleCreateConcept} className="bg-white rounded-3xl p-6 border-2 border-neutral-900 shadow-xl space-y-4">
          <h3 className="font-extrabold text-neutral-900 text-base">Añadir Nuevo Concepto Manualmente</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-neutral-700">Término o Concepto:</label>
              <input
                type="text"
                id="add-concept-term"
                value={term}
                onChange={(e) => setTerm(e.target.value)}
                required
                placeholder="Ej. Inbound Marketing"
                className="w-full mt-1 p-3 rounded-xl border border-neutral-200 text-xs text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-400"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-neutral-700">Tema o Asignatura:</label>
              <select
                id="add-concept-topic"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                className="w-full mt-1 p-3 rounded-xl border border-neutral-200 text-xs text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-400"
              >
                {TOPIC_GROUPS.map(g => (
                  <option key={g.id} value={g.name}>{g.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-neutral-700">Definición Sencilla:</label>
              <textarea
                rows={2}
                id="add-concept-def"
                value={simpleDefinition}
                onChange={(e) => setSimpleDefinition(e.target.value)}
                required
                placeholder="Explicación clara y fácil de entender..."
                className="w-full mt-1 p-3 rounded-xl border border-neutral-200 text-xs text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-400"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-neutral-700">Ejemplo Práctico Real:</label>
              <textarea
                rows={2}
                id="add-concept-example"
                value={practicalExample}
                onChange={(e) => setPracticalExample(e.target.value)}
                placeholder="Ejemplo con una marca famosa..."
                className="w-full mt-1 p-3 rounded-xl border border-neutral-200 text-xs text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-400"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setIsAddFormOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-bold text-neutral-600 hover:bg-neutral-100"
            >
              Cancelar
            </button>
            <button
              type="submit"
              id="save-manual-concept-btn"
              className="px-6 py-2 rounded-xl bg-neutral-900 text-white font-bold text-xs shadow hover:bg-neutral-800 transition"
            >
              Guardar Concepto
            </button>
          </div>
        </form>
      )}

      {/* FILTER & SEARCH BAR */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-neutral-400 absolute left-4 top-3.5" />
          <input
            type="text"
            id="glossary-search-input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por nombre, definición o ejemplo..."
            className="w-full pl-11 pr-4 py-3 rounded-2xl border border-neutral-200 bg-white text-xs font-medium text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-400"
          />
        </div>

        <select
          id="glossary-topic-filter"
          value={selectedTopic}
          onChange={(e) => setSelectedTopic(e.target.value)}
          className="px-4 py-3 rounded-2xl border border-neutral-200 bg-white text-xs font-bold text-neutral-800 focus:outline-none focus:ring-2 focus:ring-neutral-400 w-full sm:w-auto"
        >
          <option value="all">Todos los Temas ({concepts.length})</option>
          {TOPIC_GROUPS.map(g => (
            <option key={g.id} value={g.name}>{g.name}</option>
          ))}
        </select>
      </div>

      {/* CONCEPTS LIST GRID */}
      <div className="space-y-4">
        {filteredConcepts.map((concept) => (
          <div 
            key={concept.id}
            className="p-5 rounded-3xl bg-white border border-neutral-200 shadow-sm hover:border-neutral-300 transition-all space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{concept.emoji}</span>
                <h3 className="font-extrabold text-neutral-900 text-base">{concept.term}</h3>
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-neutral-100 text-neutral-700">
                  {concept.topic}
                </span>
              </div>

              <span className={`text-xs font-extrabold px-3 py-1 rounded-full ${
                concept.masteryLevel >= 80 ? 'bg-emerald-100 text-emerald-900' : 'bg-amber-100 text-amber-900'
              }`}>
                {concept.masteryLevel}% Dominio
              </span>
            </div>

            <p className="text-xs sm:text-sm text-neutral-800 font-medium leading-relaxed">
              "{concept.simpleDefinition}"
            </p>

            <div className="p-3 rounded-2xl bg-neutral-50 border border-neutral-200/80 text-xs text-neutral-600">
              <strong className="text-neutral-900">Ejemplo:</strong> {concept.practicalExample}
            </div>

            {concept.synonyms && concept.synonyms.length > 0 && (
              <div className="text-[11px] text-neutral-400 font-medium flex items-center gap-1">
                <span>Sinónimos / Equivalentes:</span>
                <span className="text-neutral-700 font-bold">{concept.synonyms.join(', ')}</span>
              </div>
            )}
          </div>
        ))}
      </div>

    </div>
  );
};
