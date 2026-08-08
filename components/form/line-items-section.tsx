"use client";

/** LineItemsSection — dynamic line items table with drag-and-drop reordering. */

import { useCallback, useState } from "react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { AnimatePresence, motion } from "framer-motion";
import { GripVertical, Trash2, Plus } from "lucide-react";

import { useInvoiceStore } from "@/lib/store";
import { useTranslations } from "@/lib/i18n";
import { VALIDATION_LIMITS } from "@/lib/constants";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { LineItem } from "@/lib/types";

// Common Bulgarian unit of measure options
const UNIT_OPTIONS = [
  { value: "бр.", label: "бр. (бройки)" },
  { value: "час", label: "час" },
  { value: "ден", label: "ден" },
  { value: "мес.", label: "мес. (месец)" },
  { value: "кг", label: "кг" },
  { value: "км", label: "км" },
  { value: "л", label: "л (литър)" },
  { value: "м²", label: "м²" },
  { value: "услуга", label: "услуга" },
  { value: "комплект", label: "комплект" },
];

// ─── UnitCombobox — editable select for unit of measure ─────────────────────

interface UnitComboboxProps {
  value: string;
  onChange: (value: string) => void;
  ariaLabel: string;
}

function UnitCombobox({ value, onChange, ariaLabel }: UnitComboboxProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <Input
        aria-label={ariaLabel}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setIsOpen(true)}
        onBlur={() => {
          // Delay to allow click on option
          setTimeout(() => setIsOpen(false), 150);
        }}
        maxLength={VALIDATION_LIMITS.maxUnitOfMeasureLength}
        placeholder="бр."
        className="w-full"
      />
      {isOpen && (
        <div className="absolute z-20 top-full left-0 right-0 mt-1 max-h-40 overflow-auto rounded-md border border-border bg-popover shadow-md">
          {UNIT_OPTIONS.filter((opt) =>
            opt.value.toLowerCase().includes(value.toLowerCase()) ||
            opt.label.toLowerCase().includes(value.toLowerCase())
          ).map((opt) => (
            <button
              key={opt.value}
              type="button"
              className="w-full text-left px-3 py-1.5 text-xs hover:bg-muted transition-colors"
              onMouseDown={(e) => {
                e.preventDefault();
                onChange(opt.value);
                setIsOpen(false);
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── SortableLineItem — a single draggable row ─────────────────────────────

interface SortableLineItemProps {
  item: LineItem;
  index: number;
  canDelete: boolean;
  onUpdate: (index: number, data: Partial<LineItem>) => void;
  onRemove: (index: number) => void;
}

function SortableLineItem({
  item,
  index,
  canDelete,
  onUpdate,
  onRemove,
}: SortableLineItemProps) {
  const { t } = useTranslations();
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.2 }}
      className={`rounded-md border border-border p-3 ${
        isDragging ? "opacity-50 shadow-lg z-10" : ""
      }`}
    >
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:gap-3">
        {/* Drag handle */}
        <button
          type="button"
          className="cursor-grab touch-none text-muted-foreground hover:text-foreground self-start md:self-center"
          aria-label={t.dragToReorder}
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-4 w-4" />
        </button>

        {/* Description */}
        <div className="flex-1 min-w-0">
          <Input
            aria-label={`${t.description} ${index + 1}`}
            value={item.description}
            onChange={(e) => onUpdate(index, { description: e.target.value })}
            maxLength={VALIDATION_LIMITS.maxDescriptionLength}
            placeholder={t.description}
          />
        </div>

        {/* Quantity */}
        <div className="w-full md:w-24">
          <Input
            type="number"
            aria-label={`${t.qty} ${index + 1}`}
            value={item.quantity || ""}
            onChange={(e) => {
              const val = parseFloat(e.target.value);
              onUpdate(index, { quantity: isNaN(val) ? 0 : val });
            }}
            min={VALIDATION_LIMITS.minQuantity}
            max={VALIDATION_LIMITS.maxQuantity}
            step="0.01"
            placeholder={t.qty}
          />
        </div>

        {/* Unit Price */}
        <div className="w-full md:w-32">
          <Input
            type="number"
            aria-label={`${t.unitPrice} ${index + 1}`}
            value={item.unitPrice || ""}
            onChange={(e) => {
              const val = parseFloat(e.target.value);
              onUpdate(index, { unitPrice: isNaN(val) ? 0 : val });
            }}
            min={VALIDATION_LIMITS.minUnitPrice}
            max={VALIDATION_LIMITS.maxUnitPrice}
            step="0.01"
            placeholder={t.unitPrice}
          />
        </div>

        {/* Unit of Measure — combobox */}
        <div className="w-full md:w-28">
          <UnitCombobox
            ariaLabel={`${t.unit} ${index + 1}`}
            value={item.unitOfMeasure}
            onChange={(val) => onUpdate(index, { unitOfMeasure: val })}
          />
        </div>

        {/* Line Total (read-only) */}
        <div className="w-full md:w-28 text-right">
          <span className="font-mono text-sm font-medium text-foreground">
            {item.lineTotal.toFixed(2)} лв.
          </span>
        </div>

        {/* Delete button */}
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={() => onRemove(index)}
          disabled={!canDelete}
          aria-label={`${t.deleteLineItem} ${index + 1}`}
          className="self-end md:self-center text-muted-foreground hover:text-destructive"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </motion.div>
  );
}

// ─── LineItemsSection — the main section component ──────────────────────────

export function LineItemsSection() {
  const { t } = useTranslations();
  const lineItems = useInvoiceStore((s) => s.lineItems);
  const addLineItem = useInvoiceStore((s) => s.addLineItem);
  const removeLineItem = useInvoiceStore((s) => s.removeLineItem);
  const updateLineItem = useInvoiceStore((s) => s.updateLineItem);
  const reorderLineItems = useInvoiceStore((s) => s.reorderLineItems);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;
      const oldIndex = lineItems.findIndex((item) => item.id === active.id);
      const newIndex = lineItems.findIndex((item) => item.id === over.id);
      if (oldIndex !== -1 && newIndex !== -1) {
        reorderLineItems(oldIndex, newIndex);
      }
    },
    [lineItems, reorderLineItems]
  );

  const canDelete = lineItems.length > VALIDATION_LIMITS.minLineItems;
  const canAdd = lineItems.length < VALIDATION_LIMITS.maxLineItems;

  return (
    <section
      className="rounded-lg border border-border p-4 space-y-3"
      aria-labelledby="line-items-heading"
    >
      <div className="flex items-center justify-between">
        <h3 id="line-items-heading" className="text-sm font-semibold text-foreground">
          {t.lineItems}
        </h3>
        <span className="text-xs text-muted-foreground">
          {lineItems.length} / {VALIDATION_LIMITS.maxLineItems}
        </span>
      </div>

      {/* Column headers — visible on desktop */}
      <div className="hidden md:flex items-center gap-3 px-3 text-xs text-muted-foreground">
        <div className="w-4" />
        <div className="flex-1">{t.description}</div>
        <div className="w-24">{t.qty}</div>
        <div className="w-32">{t.unitPrice}</div>
        <div className="w-28">{t.unit}</div>
        <div className="w-28 text-right">{t.total}</div>
        <div className="w-7" />
      </div>

      {/* Sortable line items list */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={lineItems.map((item) => item.id)}
          strategy={verticalListSortingStrategy}
        >
          <AnimatePresence initial={false}>
            {lineItems.map((item, index) => (
              <SortableLineItem
                key={item.id}
                item={item}
                index={index}
                canDelete={canDelete}
                onUpdate={updateLineItem}
                onRemove={removeLineItem}
              />
            ))}
          </AnimatePresence>
        </SortableContext>
      </DndContext>

      {/* Add row button */}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={addLineItem}
        disabled={!canAdd}
        className="w-full"
      >
        <Plus className="h-4 w-4" />
        {t.addRow}
      </Button>
    </section>
  );
}
