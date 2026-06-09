import { useState } from 'react'

import { useFinance } from '../../contexts/finance-context'
import type { FinanceCategory } from '../../types/finance'
import { getCategoriesByType } from '../../utils/finance'
import { CategoryModal } from './category-modal'

export function FinanceCategories() {
  const { categories, addCategory, updateCategory, deleteCategory } =
    useFinance()
  const [editingCategory, setEditingCategory] =
    useState<FinanceCategory | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const groupedCategories = getCategoriesByType(categories)

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-zinc-950">Categories</h3>
          <p className="text-sm text-zinc-500">
            Pisahkan kategori income dan expense untuk laporan yang lebih rapi.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setEditingCategory(null)
            setIsModalOpen(true)
          }}
          className="rounded-md bg-green-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-green-600"
        >
          Add Category
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <CategoryGroup
          title="Income Categories"
          categories={groupedCategories.income}
          onEdit={(category) => {
            setEditingCategory(category)
            setIsModalOpen(true)
          }}
          onDelete={deleteCategory}
        />
        <CategoryGroup
          title="Expense Categories"
          categories={groupedCategories.expense}
          onEdit={(category) => {
            setEditingCategory(category)
            setIsModalOpen(true)
          }}
          onDelete={deleteCategory}
        />
      </div>

      {isModalOpen && (
        <CategoryModal
          key={editingCategory?.id ?? 'new-category'}
          category={editingCategory}
          onClose={() => setIsModalOpen(false)}
          onSubmit={(category) =>
            editingCategory
              ? updateCategory(editingCategory.id, category)
              : addCategory(category)
          }
        />
      )}
    </div>
  )
}

type CategoryGroupProps = {
  title: string
  categories: FinanceCategory[]
  onEdit: (category: FinanceCategory) => void
  onDelete: (categoryId: string) => void
}

function CategoryGroup({
  title,
  categories,
  onEdit,
  onDelete,
}: CategoryGroupProps) {
  return (
    <section className="rounded-md border border-zinc-200 p-4">
      <h4 className="font-semibold text-zinc-950">{title}</h4>

      <div className="mt-3 grid gap-2">
        {categories.length === 0 ? (
          <p className="text-sm text-zinc-500">Belum ada kategori.</p>
        ) : (
          categories.map((category) => (
            <div
              key={category.id}
              className="flex items-center justify-between gap-3 rounded-md bg-zinc-50 p-3"
            >
              <div className="flex items-center gap-2">
                <span
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: category.color }}
                />
                <span className="text-sm font-semibold text-zinc-800">
                  {category.name}
                </span>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => onEdit(category)}
                  className="rounded-md bg-white px-2.5 py-1 text-sm font-semibold text-zinc-700"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(category.id)}
                  className="rounded-md bg-red-500 px-2.5 py-1 text-sm font-semibold text-white"
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  )
}
