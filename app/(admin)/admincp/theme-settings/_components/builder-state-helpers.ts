import {
  BuilderItem,
  ColumnWidth,
  HomepageBlock,
  PageBuilderColumn,
  PageBuilderRow,
  PageBuilderSection,
  RowPreset,
} from "@/lib/themes/homepage-types";

export function getPresetColumns(preset: RowPreset): { width: ColumnWidth }[] {
  switch (preset) {
    case "1/1":
      return [{ width: "12/12" }];
    case "1/2_1/2":
      return [{ width: "6/12" }, { width: "6/12" }];
    case "2/3_1/3":
      return [{ width: "8/12" }, { width: "4/12" }];
    case "1/3_2/3":
      return [{ width: "4/12" }, { width: "8/12" }];
    case "1/3_1/3_1/3":
      return [{ width: "4/12" }, { width: "4/12" }, { width: "4/12" }];
    case "1/4_1/2_1/4":
      return [{ width: "3/12" }, { width: "6/12" }, { width: "3/12" }];
    default:
      return [{ width: "12/12" }];
  }
}

export function createDefaultRow(preset: RowPreset = "1/1"): PageBuilderRow {
  const rowId = `row-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
  const specs = getPresetColumns(preset);

  return {
    id: rowId,
    preset,
    columns: specs.map((s, idx) => ({
      id: `col-${rowId}-${idx}`,
      width: s.width,
      items: [],
    })),
  };
}

export function createDefaultSection(title = ""): PageBuilderSection {
  const sectionId = `sec-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
  return {
    id: sectionId,
    title,
    container: "boxed",
    paddingY: "md",
    rows: [createDefaultRow("1/1")],
  };
}

export function changeRowPreset(row: PageBuilderRow, newPreset: RowPreset): PageBuilderRow {
  const newSpecs = getPresetColumns(newPreset);
  const existingItems = row.columns.flatMap((c) => c.items);

  const newColumns: PageBuilderColumn[] = newSpecs.map((spec, idx) => {
    const existingCol = row.columns[idx];
    return {
      id: existingCol ? existingCol.id : `col-${row.id}-${idx}`,
      width: spec.width,
      items: idx === 0 ? existingItems : [],
    };
  });

  return {
    ...row,
    preset: newPreset,
    columns: newColumns,
  };
}

export function addItemToColumn(
  sections: PageBuilderSection[],
  columnId: string,
  item: BuilderItem
): PageBuilderSection[] {
  return sections.map((sec) => ({
    ...sec,
    rows: sec.rows.map((row) => ({
      ...row,
      columns: row.columns.map((col) =>
        col.id === columnId ? { ...col, items: [...col.items, item] } : col
      ),
    })),
  }));
}

export function updateBlockInColumn(
  sections: PageBuilderSection[],
  blockId: string,
  updates: Partial<HomepageBlock>
): PageBuilderSection[] {
  return sections.map((sec) => ({
    ...sec,
    rows: sec.rows.map((row) => ({
      ...row,
      columns: row.columns.map((col) => ({
        ...col,
        items: col.items.map((item) =>
          item.type === "block" && item.block && item.block.id === blockId
            ? { ...item, block: { ...item.block, ...updates } }
            : item
        ),
      })),
    })),
  }));
}

export function toggleBlockEnabledInSections(
  sections: PageBuilderSection[],
  blockId: string
): PageBuilderSection[] {
  return sections.map((sec) => ({
    ...sec,
    rows: sec.rows.map((row) => ({
      ...row,
      columns: row.columns.map((col) => ({
        ...col,
        items: col.items.map((item) =>
          item.type === "block" && item.block && item.block.id === blockId
            ? { ...item, block: { ...item.block, enabled: !item.block.enabled } }
            : item
        ),
      })),
    })),
  }));
}

export function updateWidgetInColumn(
  sections: PageBuilderSection[],
  columnId: string,
  itemId: string,
  updates: { title?: string; config?: Record<string, any> }
): PageBuilderSection[] {
  return sections.map((sec) => ({
    ...sec,
    rows: sec.rows.map((row) => ({
      ...row,
      columns: row.columns.map((col) =>
        col.id === columnId
          ? {
              ...col,
              items: col.items.map((it) =>
                it.id === itemId && it.type === "widget"
                  ? {
                      ...it,
                      ...updates,
                      config: {
                        ...(it.config || {}),
                        ...(updates.config || {}),
                      },
                    }
                  : it
              ),
            }
          : col
      ),
    })),
  }));
}

export function removeItemFromColumn(
  sections: PageBuilderSection[],
  columnId: string,
  itemId: string
): PageBuilderSection[] {
  return sections.map((sec) => ({
    ...sec,
    rows: sec.rows.map((row) => ({
      ...row,
      columns: row.columns.map((col) =>
        col.id === columnId
          ? { ...col, items: col.items.filter((it) => it.id !== itemId) }
          : col
      ),
    })),
  }));
}

export function deleteRowFromSections(
  sections: PageBuilderSection[],
  rowId: string
): PageBuilderSection[] {
  return sections.map((sec) => ({
    ...sec,
    rows: sec.rows.filter((r) => r.id !== rowId),
  }));
}

export function deleteSectionFromList(
  sections: PageBuilderSection[],
  sectionId: string
): PageBuilderSection[] {
  return sections.filter((s) => s.id !== sectionId);
}

export function reorderArray<T>(list: T[], startIndex: number, endIndex: number): T[] {
  const result = Array.from(list);
  const [removed] = result.splice(startIndex, 1);
  result.splice(endIndex, 0, removed);
  return result;
}
