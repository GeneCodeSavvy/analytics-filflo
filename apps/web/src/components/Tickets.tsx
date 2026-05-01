import { useTicketsPageData } from '../hooks/useTicketsPageData';
import { useTicketsPageActions } from '../hooks/useTicketsPageActions';
import { useMutationState } from '@tanstack/react-query';
import type { TicketFilters } from '../lib/ticketParams';
import { useTicketStore } from '../stores/useTicketStore';

export const Tickets = () => {
  const { data, status, url, ui } = useTicketsPageData();
  const actions = useTicketsPageActions();
  const anyMutationPending = useMutationState({
    filters: { status: 'pending' },
    select: (m) => (m as { state: { status: string } }).state.status === 'pending',
  }).some(Boolean);

  const density = useTicketStore((s) => s.density);

  const handleFilterChange = (key: keyof TicketFilters, values: string[]) => {
    const current = url.filters[key] as string[] | undefined;
    if (JSON.stringify(current) === JSON.stringify(values)) return;

    if (key === 'status') {
      actions.setFilters({ status: values as any });
    } else if (key === 'priority') {
      actions.setFilters({ priority: values as any });
    } else if (key === 'category') {
      actions.setFilters({ category: values });
    } else if (key === 'assigneeIds') {
      actions.setFilters({ assigneeIds: values });
    }
  };

  const handlePageChange = (newPage: number) => {
    actions.setPage(newPage);
  };

  const handleRowClick = (ticketId: string) => {
    actions.openDrawer(ticketId);
  };

  const handleRowSelect = (ticketId: string) => {
    actions.toggleRowSelected(ticketId);
  };

  const handleSelectAll = () => {
    if (ui.selectedRowIds.length === data.rows.length) {
      actions.clearSelection();
    } else {
      actions.setSelectedRows(data.rows.map((r) => r.id));
    }
  };

  const handleCreateClick = () => {
    actions.openModal();
  };

  const handleViewChange = (viewId: string | null) => {
    actions.setView(viewId);
  };

  const handleDensityChange = (d: 'compact' | 'comfortable') => {
    actions.setDensity(d);
  };

  const hasActiveFilters =
    (url.filters.status?.length ?? 0) > 0 ||
    (url.filters.priority?.length ?? 0) > 0 ||
    (url.filters.category?.length ?? 0) > 0 ||
    (url.filters.assigneeIds?.length ?? 0) > 0 ||
    url.filters.q;

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-semibold">Tickets</h1>
          {data.views.length > 0 && (
            <div className="flex gap-1">
              {data.views.map((view) => (
                <button
                  key={view.id}
                  onClick={() => handleViewChange(view.id)}
                  disabled={anyMutationPending}
                  className={`px-3 py-1 text-sm rounded ${
                    url.viewId === view.id
                      ? 'bg-primary text-white'
                      : 'bg-muted hover:bg-muted/80'
                  }`}
                >
                  {view.name}
                </button>
              ))}
              <button
                onClick={() => handleViewChange(null)}
                disabled={anyMutationPending}
                className={`px-3 py-1 text-sm rounded ${
                  !url.viewId ? 'bg-primary text-white' : 'bg-muted hover:bg-muted/80'
                }`}
              >
                All
              </button>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {ui.newTicketsBannerCount > 0 && (
            <button className="px-3 py-1 text-sm bg-yellow-500 text-white rounded hover:bg-yellow-600">
              {ui.newTicketsBannerCount} new tickets
            </button>
          )}
          <button
            onClick={handleCreateClick}
            className="px-4 py-2 bg-primary text-white rounded hover:bg-primary/90"
          >
            Create Ticket
          </button>
        </div>
      </div>

      <div className="flex items-center gap-4 p-4 border-b">
        <div className="flex flex-wrap gap-2">
          <select
            disabled={anyMutationPending}
            value={url.filters.status?.join(',') ?? ''}
            onChange={(e) =>
              handleFilterChange(
                'status',
                e.target.value ? e.target.value.split(',') : []
              )
            }
            className="px-2 py-1 border rounded"
          >
            <option value="">All Status</option>
            <option value="OPEN">Open</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="ON_HOLD">On Hold</option>
            <option value="REVIEW">Review</option>
            <option value="RESOLVED">Resolved</option>
            <option value="CLOSED">Closed</option>
          </select>

          <select
            disabled={anyMutationPending}
            value={url.filters.priority?.join(',') ?? ''}
            onChange={(e) =>
              handleFilterChange(
                'priority',
                e.target.value ? e.target.value.split(',') : []
              )
            }
            className="px-2 py-1 border rounded"
          >
            <option value="">All Priority</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>

          <input
            type="text"
            placeholder="Search..."
            value={url.filters.q ?? ''}
            onChange={(e) => actions.setFilters({ q: e.target.value || undefined })}
            disabled={anyMutationPending}
            className="px-2 py-1 border rounded"
          />

          {hasActiveFilters && (
            <button
              onClick={() => actions.setFilters({ status: [], priority: [], category: [], assigneeIds: [], q: undefined })}
              className="px-2 py-1 text-sm text-red-500 hover:underline"
            >
              Clear filters
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 ml-auto">
          <button
            onClick={() => handleDensityChange('compact')}
            className={`px-2 py-1 text-sm ${density === 'compact' ? 'bg-muted' : ''}`}
          >
            Compact
          </button>
          <button
            onClick={() => handleDensityChange('comfortable')}
            className={`px-2 py-1 text-sm ${density === 'comfortable' ? 'bg-muted' : ''}`}
          >
            Comfortable
          </button>
        </div>
      </div>

      {status.loading && (
        <div className="flex items-center justify-center p-8">
          <div className="text-muted-foreground">Loading tickets...</div>
        </div>
      )}

      {status.error && (
        <div className="flex items-center justify-center p-8 text-red-500">
          Failed to load tickets
        </div>
      )}

      {!status.loading && !status.error && (
        <>
          <div className="flex-1 overflow-auto">
            <table className="w-full">
              <thead className="sticky top-0 bg-background border-b">
                <tr>
                  <th className="w-10 p-2">
                    <input
                      type="checkbox"
                      checked={
                        ui.selectedRowIds.length > 0 &&
                        ui.selectedRowIds.length === data.rows.length
                      }
                      onChange={handleSelectAll}
                    />
                  </th>
                  <th className="p-2 text-left">Subject</th>
                  <th className="p-2 text-left">Status</th>
                  <th className="p-2 text-left">Priority</th>
                  <th className="p-2 text-left">Assignee</th>
                  <th className="p-2 text-left">Org</th>
                  <th className="p-2 text-left">Updated</th>
                </tr>
              </thead>
              <tbody>
                {data.rows.map((row) => (
                  <tr
                    key={row.id}
                    onClick={() => handleRowClick(row.id)}
                    className={`border-b cursor-pointer hover:bg-muted/50 ${
                      density === 'compact' ? 'py-1' : 'py-3'
                    }`}
                  >
                    <td className="p-2" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={ui.selectedRowIds.includes(row.id)}
                        onChange={() => handleRowSelect(row.id)}
                      />
                    </td>
                    <td className="p-2">
                      <div className="font-medium">{row.subject}</div>
                      <div className="text-sm text-muted-foreground">
                        {row.descriptionPreview}
                      </div>
                    </td>
                    <td className="p-2">
                      <span
                        className={`px-2 py-0.5 text-xs rounded ${
                          row.status === 'OPEN'
                            ? 'bg-green-100 text-green-800'
                            : row.status === 'IN_PROGRESS'
                            ? 'bg-blue-100 text-blue-800'
                            : row.status === 'CLOSED'
                            ? 'bg-gray-100 text-gray-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {row.status}
                      </span>
                    </td>
                    <td className="p-2">
                      <span
                        className={`px-2 py-0.5 text-xs rounded ${
                          row.priority === 'HIGH'
                            ? 'bg-red-100 text-red-800'
                            : row.priority === 'MEDIUM'
                            ? 'bg-orange-100 text-orange-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {row.priority}
                      </span>
                    </td>
                    <td className="p-2">
                      {row.primaryAssignee ? (
                        <div className="flex items-center gap-2">
                          {row.primaryAssignee.avatarUrl && (
                            <img
                              src={row.primaryAssignee.avatarUrl}
                              alt=""
                              className="w-6 h-6 rounded-full"
                            />
                          )}
                          <span>{row.primaryAssignee.name}</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">Unassigned</span>
                      )}
                      {row.assigneeCount > 1 && (
                        <span className="text-muted-foreground ml-1">
                          +{row.assigneeCount - 1}
                        </span>
                      )}
                    </td>
                    <td className="p-2">{row.org.name}</td>
                    <td className="p-2 text-sm text-muted-foreground">
                      {new Date(row.updatedAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between p-4 border-t">
            <div className="text-sm text-muted-foreground">
              Showing {data.rows.length} of {data.total} tickets
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handlePageChange(url.page - 1)}
                disabled={url.page <= 1}
                className="px-3 py-1 border rounded disabled:opacity-50"
              >
                Previous
              </button>
              <span className="px-3 py-1">Page {url.page}</span>
              <button
                onClick={() => handlePageChange(url.page + 1)}
                disabled={data.rows.length < 25}
                className="px-3 py-1 border rounded disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        </>
      )}

      {url.modalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background p-6 rounded-lg w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">Create Ticket</h2>
            <p className="text-muted-foreground">Create ticket modal placeholder</p>
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={actions.closeModal}
                className="px-4 py-2 border rounded"
              >
                Cancel
              </button>
              <button
                onClick={actions.closeModal}
                className="px-4 py-2 bg-primary text-white rounded"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {url.drawerTicketId && data.detail && (
        <div className="fixed inset-y-0 right-0 w-[500px] bg-background border-l shadow-lg z-40 flex flex-col">
          <div className="flex items-center justify-between p-4 border-b">
            <h2 className="text-xl font-semibold">{data.detail.subject}</h2>
            <button
              onClick={actions.closeDrawer}
              className="text-muted-foreground hover:text-foreground"
            >
              ✕
            </button>
          </div>
          <div className="flex-1 overflow-auto p-4">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Status</label>
                <div className="mt-1">{data.detail.status}</div>
              </div>
              <div>
                <label className="text-sm font-medium">Priority</label>
                <div className="mt-1">{data.detail.priority}</div>
              </div>
              <div>
                <label className="text-sm font-medium">Description</label>
                <div className="mt-1 text-muted-foreground">
                  {data.detail.description || data.detail.descriptionPreview}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Assignees</label>
                <div className="mt-1">
                  {data.detail.primaryAssignee?.name || 'Unassigned'}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Requester</label>
                <div className="mt-1">{data.detail.requester.name}</div>
              </div>
              <div>
                <label className="text-sm font-medium">Organization</label>
                <div className="mt-1">{data.detail.org.name}</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Tickets;
