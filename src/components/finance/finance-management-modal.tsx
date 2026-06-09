import { useState } from 'react'

import { FinanceProvider } from '../../contexts/finance-context'
import type { FinanceTab } from '../../types/finance'
import { FinanceCategories } from './finance-categories'
import { FinanceDashboard } from './finance-dashboard'
import { FinanceReports } from './finance-reports'
import { FinanceTransactions } from './finance-transactions'

type FinanceManagementModalProps = {
  onClose: () => void
}

const financeTabs: Array<{ id: FinanceTab; label: string }> = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'transactions', label: 'Transactions' },
  { id: 'categories', label: 'Categories' },
  { id: 'statistics', label: 'Statistics' },
]

export function FinanceManagementModal({
  onClose,
}: FinanceManagementModalProps) {
  const [activeFinanceTab, setActiveFinanceTab] =
    useState<FinanceTab>('dashboard')

  return (
    <div className="finance-overlay fixed inset-0 z-[999] flex items-center justify-center bg-slate-900/45 px-4 backdrop-blur-md">
      <FinanceProvider>
        <div className="finance-modal flex max-h-[86vh] w-[min(1100px,92vw)] flex-col overflow-hidden rounded-[18px] bg-white shadow-2xl">
          <div className="finance-modal-header flex shrink-0 items-center justify-between gap-4 border-b border-zinc-200 px-6 py-5">
            <div>
              <h2 className="text-xl font-semibold text-zinc-950">
                Management Keuangan
              </h2>
              <p className="text-sm text-zinc-500">
                Kelola transaksi, kategori, dan statistik keuangan.
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="rounded-md bg-red-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-600"
            >
              Close
            </button>
          </div>

          <div className="finance-modal-tabs flex shrink-0 gap-2 overflow-x-auto border-b border-zinc-200 px-6 py-3">
            {financeTabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveFinanceTab(tab.id)}
                className={`whitespace-nowrap rounded-md px-3 py-2 text-sm font-semibold transition ${
                  activeFinanceTab === tab.id
                    ? 'bg-green-500 text-white'
                    : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="finance-modal-content min-h-0 flex-1 overflow-y-auto p-6">
            {activeFinanceTab === 'dashboard' && <FinanceDashboard />}
            {activeFinanceTab === 'transactions' && <FinanceTransactions />}
            {activeFinanceTab === 'categories' && <FinanceCategories />}
            {activeFinanceTab === 'statistics' && <FinanceReports />}
          </div>
        </div>
      </FinanceProvider>
    </div>
  )
}
