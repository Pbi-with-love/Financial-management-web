import { useNavigate } from 'react-router-dom';
import { useMembers } from '@/api';
import { formatCents } from '@/lib/format';

export default function Dashboard() {
  const navigate = useNavigate();
  const { data: members, isLoading, isError, refetch } = useMembers();

  return (
    <div className="max-w-4xl mx-auto px-4 md:px-8 py-6">
      <h1
        className="text-2xl font-semibold font-heading mb-6"
        style={{ fontFamily: 'Lexend, sans-serif' }}
      >
        Dashboard
      </h1>

      {isLoading && (
        <div className="flex items-center justify-center py-16">
          <span className="text-muted-foreground">Loading...</span>
        </div>
      )}

      {isError && (
        <div className="flex flex-col items-center justify-center py-16 gap-4">
          <p className="text-red-600">Failed to load member balances.</p>
          <button
            onClick={() => refetch()}
            className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-colors"
            style={{ fontFamily: 'Lexend, sans-serif' }}
          >
            Retry
          </button>
        </div>
      )}

      {members && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {members.map((member) => {
            const balance = member.balanceCents ?? 0;
            const balanceColor =
              balance > 0
                ? 'text-emerald-600'
                : balance < 0
                  ? 'text-red-600'
                  : 'text-foreground';

            return (
              <div
                key={member.id}
                onClick={() => navigate(`/members/${member.id}`)}
                className="bg-white rounded-xl shadow-sm border border-border p-5 hover:shadow-md transition-shadow cursor-pointer"
              >
                <p
                  className="text-sm font-medium text-muted-foreground mb-1 truncate"
                  style={{ fontFamily: 'Lexend, sans-serif' }}
                >
                  {member.name}
                </p>
                <p
                  className={`text-2xl font-semibold ${balanceColor}`}
                  style={{ fontFamily: 'Lexend, sans-serif' }}
                >
                  {formatCents(balance)}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
