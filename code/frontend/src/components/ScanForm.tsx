import { useState, FormEvent } from 'react';

interface ScanFormProps {
  onSubmit: (repositoryUrl: string) => void;
  loading: boolean;
}

export function ScanForm({ onSubmit, loading }: ScanFormProps) {
  const [url, setUrl] = useState('');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (url.trim() && !loading) {
      onSubmit(url.trim());
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-2xl">
      <label htmlFor="repo-url" className="block text-sm font-medium text-gray-700 mb-2">
        GitHub Repository URL
      </label>
      <div className="flex gap-3">
        <input
          id="repo-url"
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://github.com/owner/repository"
          className="flex-1 px-4 py-2.5 text-sm border border-gray-300 rounded-md bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-shadow"
          disabled={loading}
          required
        />
        <button
          type="submit"
          disabled={loading || !url.trim()}
          className="px-5 py-2.5 text-sm font-medium text-white bg-gray-900 rounded-md hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
        >
          {loading ? 'Scanning...' : 'Scan Repository'}
        </button>
      </div>
    </form>
  );
}
