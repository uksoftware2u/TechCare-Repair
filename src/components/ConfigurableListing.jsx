import { useEffect, useRef, useState } from "react";
import { Check, Columns, FloppyDisk } from "@phosphor-icons/react";
import { databaseApi } from "../database-api.js";
import "./ConfigurableListing.css";
import "./ConfigurableListingHeader.css";

function mergeLayout(defaultColumns, saved) {
  try {
    if (!Array.isArray(saved)) return defaultColumns;
    const valid = saved.filter(column => defaultColumns.some(item => item.id === column.id));
    const missing = defaultColumns.filter(column => !valid.some(item => item.id === column.id));
    return [...valid, ...missing].map(column => ({ ...defaultColumns.find(item => item.id === column.id), ...column }));
  } catch { return defaultColumns; }
}

export function ConfigurableListing({
  columns: defaultColumns,
  rows,
  rowKey,
  renderCell,
  onRowClick,
  rowClassName,
  storageKey,
  toolbar,
  emptyMessage = "No records found.",
  recordLabel = "records",
  totalCount = rows.length,
  minColumnWidth = 90,
  maxColumnWidth = 420
}) {
  const [columns, setColumns] = useState(defaultColumns);
  const [chooserOpen, setChooserOpen] = useState(false);
  const [notice, setNotice] = useState("");
  const draggedColumn = useRef(null);
  const visibleColumns = columns.filter(column => column.visible);
  const gridTemplate = visibleColumns.map(column => `${column.width}px`).join(" ");
  const tableWidth = visibleColumns.reduce((total, column) => total + column.width, 0);

  useEffect(() => {
    databaseApi.preference("aisyah", storageKey)
      .then((saved) => setColumns(mergeLayout(defaultColumns, saved)))
      .catch(() => setColumns(defaultColumns));
  }, [defaultColumns, storageKey]);

  function toggleColumn(id) {
    if (visibleColumns.length === 1 && visibleColumns[0].id === id) return;
    setColumns(current => current.map(column => column.id === id ? { ...column, visible: !column.visible } : column));
  }

  function moveColumn(targetId) {
    const sourceId = draggedColumn.current;
    if (!sourceId || sourceId === targetId) return;
    setColumns(current => {
      const next = [...current];
      const sourceIndex = next.findIndex(column => column.id === sourceId);
      const targetIndex = next.findIndex(column => column.id === targetId);
      const [moved] = next.splice(sourceIndex, 1);
      next.splice(targetIndex, 0, moved);
      return next;
    });
    draggedColumn.current = null;
  }

  function startResize(event, id) {
    event.preventDefault();
    event.stopPropagation();
    const startX = event.clientX;
    const startWidth = columns.find(column => column.id === id).width;
    function resize(moveEvent) {
      const width = Math.max(minColumnWidth, Math.min(maxColumnWidth, startWidth + moveEvent.clientX - startX));
      setColumns(current => current.map(column => column.id === id ? { ...column, width } : column));
    }
    function stop() {
      document.removeEventListener("mousemove", resize);
      document.removeEventListener("mouseup", stop);
    }
    document.addEventListener("mousemove", resize);
    document.addEventListener("mouseup", stop);
  }

  async function saveLayout() {
    try { await databaseApi.savePreference("aisyah", storageKey, columns); setNotice("Layout saved to SQL"); }
    catch { setNotice("Unable to save layout"); }
  }

  async function resetLayout() {
    setColumns(defaultColumns);
    try { await databaseApi.savePreference("aisyah", storageKey, defaultColumns); setNotice("Default layout restored"); }
    catch { setNotice("Unable to reset layout"); }
  }

  return <section className="configurable-listing">
    <div className="cl-toolbar"><div className="cl-toolbar-main">{toolbar}</div><div className="cl-layout-actions"><div className="cl-chooser-wrap"><button aria-expanded={chooserOpen} className={chooserOpen ? "active" : ""} onClick={()=>setChooserOpen(!chooserOpen)}><Columns size={17}/> Column Chooser</button>{chooserOpen&&<div className="cl-chooser"><div><b>Show Columns</b><button onClick={resetLayout}>Reset Layout</button></div>{columns.map(column=><label key={column.id}><input type="checkbox" checked={column.visible} onChange={()=>toggleColumn(column.id)}/><span className={column.visible ? "checked" : ""}>{column.visible&&<Check size={12}/>}</span>{column.label}</label>)}<small>Drag column headers to reorder them.</small></div>}</div><button onClick={saveLayout}><FloppyDisk size={17}/> Save Layout</button></div></div>
    <div className="cl-list"><div className="cl-table-scroll"><div className="cl-table" style={{ minWidth: tableWidth }}><div className="cl-table-head" style={{ gridTemplateColumns: gridTemplate }}>{visibleColumns.map(column=><span key={column.id} draggable onDragStart={()=>draggedColumn.current=column.id} onDragEnd={()=>draggedColumn.current=null} onDragOver={event=>event.preventDefault()} onDrop={()=>moveColumn(column.id)} title="Drag to reorder"><b>{column.label}</b><i className="cl-resizer" onMouseDown={event=>startResize(event,column.id)} title="Drag to resize"/></span>)}</div>{rows.map(row=><button className={`cl-row ${rowClassName?.(row)||""}`} style={{ gridTemplateColumns: gridTemplate }} key={rowKey(row)} onClick={()=>onRowClick?.(row)}>{visibleColumns.map(column=><span className={`cl-cell cl-cell-${column.id}`} key={column.id}>{renderCell(row, column)}</span>)}</button>)}{rows.length===0&&<div className="cl-empty">{emptyMessage}</div>}</div></div></div>
    <div className="cl-footer"><span>Showing {rows.length} of {totalCount} {recordLabel}</span><div><button disabled>Previous</button><button className="active">1</button><button disabled>Next</button></div></div>
    {notice&&<div className="cl-toast" onClick={()=>setNotice("")}>{notice}</div>}
  </section>;
}
