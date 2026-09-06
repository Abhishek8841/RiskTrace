import type { ScanResponse } from '../types';

interface RepositoryInfoProps {
  scan: ScanResponse;
}

export function RepositoryInfo({ scan }: RepositoryInfoProps) {
  const { repository } = scan;

  const fields = [
    { label: 'Owner', value: repository.owner },
    { label: 'Repository', value: repository.name },
    { label: 'Branch', value: repository.defaultBranch },
    {
      label: 'Commit SHA',
      value: repository.latestCommitSha
        ? repository.latestCommitSha.substring(0, 7)
        : 'N/A',
      mono: true,
    },
    { label: 'Status', value: scan.status },
    { label: 'Ecosystems', value: scan.ecosystems.join(', ') || 'None detected' },
    { label: 'Manifest Files', value: scan.manifestFiles.join(', ') || 'None detected' },
    { label: 'Files Scanned', value: scan.fileCount.toLocaleString() },
  ];

  return (
    <div className="border border-gray-200 rounded-lg p-6">
      <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-4">
        Repository Information
      </h2>
      <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3">
        {fields.map((field) => (
          <div key={field.label} className="flex justify-between sm:block">
            <dt className="text-sm text-gray-500">{field.label}</dt>
            <dd
              className={`text-sm text-gray-900 ${field.mono ? 'font-mono' : ''} mt-0 sm:mt-0.5`}
            >
              {field.value}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
