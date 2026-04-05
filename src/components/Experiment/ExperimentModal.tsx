import { useState, useEffect } from 'react';
import { useExperimentStore } from '../../store/useExperimentStore';
import {
  EXPERIMENT_TYPES,
  DEFAULT_METADATA,
  type ExperimentType,
  type ExperimentMetadata,
} from '../../types/experiment';

interface ExperimentModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialStartDate?: string;
  initialEndDate?: string;
}

export default function ExperimentModal({
  isOpen,
  onClose,
  initialStartDate,
  initialEndDate,
}: ExperimentModalProps) {
  const { addExperiment } = useExperimentStore();

  const [title, setTitle] = useState('');
  const [type, setType] = useState<ExperimentType>('Immunofluorescence');
  const [startDate, setStartDate] = useState(initialStartDate || '');
  const [endDate, setEndDate] = useState(initialEndDate || '');
  const [sample, setSample] = useState('');
  const [notes, setNotes] = useState('');
  const [metadata, setMetadata] = useState<ExperimentMetadata[]>([]);

  useEffect(() => {
    if (initialStartDate) setStartDate(initialStartDate);
    if (initialEndDate) setEndDate(initialEndDate);
  }, [initialStartDate, initialEndDate]);

  useEffect(() => {
    setMetadata(DEFAULT_METADATA[type] || []);
  }, [type]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !startDate || !endDate) return;

    addExperiment({
      title: title.trim(),
      type,
      startDate,
      endDate,
      sample: sample.trim(),
      metadata: metadata.filter((m) => m.value.trim()),
      notes: notes.trim(),
    });

    // Reset form
    setTitle('');
    setType('Immunofluorescence');
    setSample('');
    setNotes('');
    setMetadata([]);
    onClose();
  };

  const updateMetadata = (index: number, field: 'key' | 'value', value: string) => {
    setMetadata((prev) =>
      prev.map((m, i) => (i === index ? { ...m, [field]: value } : m))
    );
  };

  const addMetadataField = () => {
    setMetadata((prev) => [...prev, { key: '', value: '' }]);
  };

  const removeMetadataField = (index: number) => {
    setMetadata((prev) => prev.filter((_, i) => i !== index));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-5 py-4 rounded-t-xl flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">New Experiment</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., GFP-actin IF staining"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              autoFocus
              required
            />
          </div>

          {/* Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as ExperimentType)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white"
            >
              {EXPERIMENT_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                min={startDate}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                required
              />
            </div>
          </div>

          {/* Sample */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Sample</label>
            <input
              type="text"
              value={sample}
              onChange={(e) => setSample(e.target.value)}
              placeholder="e.g., HeLa cells, passage 12"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
          </div>

          {/* Metadata (antibody conc, etc.) */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-medium text-gray-700">Details</label>
              <button
                type="button"
                onClick={addMetadataField}
                className="text-xs text-blue-500 hover:text-blue-600"
              >
                + Add field
              </button>
            </div>
            <div className="space-y-2">
              {metadata.map((m, i) => (
                <div key={i} className="flex gap-2">
                  <input
                    type="text"
                    value={m.key}
                    onChange={(e) => updateMetadata(i, 'key', e.target.value)}
                    placeholder="Field name"
                    className="flex-1 px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                  <input
                    type="text"
                    value={m.value}
                    onChange={(e) => updateMetadata(i, 'value', e.target.value)}
                    placeholder="Value"
                    className="flex-1 px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => removeMetadataField(i)}
                    className="text-gray-400 hover:text-red-500 px-1"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="General notes about this experiment..."
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
            />
          </div>

          {/* Submit */}
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
            >
              Create Experiment
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
