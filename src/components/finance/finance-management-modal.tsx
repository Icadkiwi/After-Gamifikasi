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
  { id: 'dashboard', label: 'Dasbor' },
  { id: 'transactions', label: 'Transaksi' },
  { id: 'categories', label: 'Kategori' },
  { id: 'statistics', label: 'Mutasi' },
]

export function FinanceManagementModal({
  onClose,
}: FinanceManagementModalProps) {
  const [activeFinanceTab, setActiveFinanceTab] =
    useState<FinanceTab>('dashboard')

  return (
    <div className="finance-overlay fixed inset-0 z-[999] flex items-stretch justify-center bg-slate-900/45 p-2 backdrop-blur-md sm:items-center sm:p-4">
      <FinanceProvider>
        <div className="finance-modal flex h-[calc(100dvh-1rem)] w-full flex-col overflow-hidden rounded-xl bg-white shadow-2xl sm:h-[86vh] sm:w-[min(1100px,92vw)] sm:rounded-[18px]">
          <div className="finance-modal-header flex shrink-0 items-center justify-between gap-3 border-b border-zinc-200 px-4 py-4 sm:gap-4 sm:px-6 sm:py-5">
            <div>
              <h2 className="text-xl font-semibold text-zinc-950">
                Manajemen Keuangan
              </h2>
              <p className="text-sm text-zinc-950">
                Kelola transaksi, kategori, dan statistik keuangan.
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="min-h-11 rounded-md bg-red-500 px-4 py-2 text-sm font-semibold text-zinc-950 transition hover:bg-red-600"
            >
              Tutup
            </button>
          </div>

          <div className="finance-modal-tabs flex shrink-0 gap-2 overflow-x-auto border-b border-zinc-200 px-4 py-3 sm:px-6">
            {financeTabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveFinanceTab(tab.id)}
                className={`min-h-11 whitespace-nowrap rounded-md px-3 py-2 text-sm font-semibold transition ${
                  activeFinanceTab === tab.id
                    ? 'bg-green-500 text-zinc-950'
                    : 'bg-zinc-100 text-zinc-950 hover:bg-zinc-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="finance-modal-content min-h-0 flex-1 overflow-y-auto p-4 sm:p-6">
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
