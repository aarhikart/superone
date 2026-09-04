"use client";

import { useMemo, useRef, useState } from "react";
import * as XLSX from "xlsx";

const REQUIRED_HEADERS = ["Employee Name", "Extension Number"];
const TEMPLATE_ROWS = [
  { "Employee Name": "Aarav Mehta", "Extension Number": "1001" },
  { "Employee Name": "Priya Sharma", "Extension Number": "1002" },
  { "Employee Name": "Rahul Verma", "Extension Number": "1003" },
];

function normalizeCell(value) {
  return value === null || value === undefined ? "" : String(value).trim();
}

function escapeHtml(value) {
  return normalizeCell(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function buildEmployeeHtml(rows) {
  const generatedAt = new Date().toLocaleString();
  const tableRows = rows
    .map(
      (row) => `
        <tr>
          <td>${escapeHtml(row.employeeName)}</td>
          <td>${escapeHtml(row.extensionNumber)}</td>
        </tr>`
    )
    .join("");

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Employee Extension Directory</title>
  <style>
    :root { color-scheme: light; font-family: Arial, Helvetica, sans-serif; }
    body { margin: 0; background: #f8fafc; color: #0f172a; }
    main { width: min(960px, calc(100% - 32px)); margin: 40px auto; }
    header { margin-bottom: 24px; }
    h1 { margin: 0; font-size: clamp(28px, 5vw, 44px); }
    p { color: #475569; }
    table { width: 100%; border-collapse: collapse; overflow: hidden; border-radius: 14px; background: #fff; box-shadow: 0 1px 4px rgba(15, 23, 42, 0.1); }
    th, td { padding: 14px 16px; border-bottom: 1px solid #e2e8f0; text-align: left; }
    th { background: #0f172a; color: #fff; font-size: 12px; letter-spacing: 0.08em; text-transform: uppercase; }
    tr:last-child td { border-bottom: 0; }
  </style>
</head>
<body>
  <main>
    <header>
      <h1>Employee Extension Directory</h1>
      <p>Total employees: ${rows.length} | Generated: ${escapeHtml(generatedAt)}</p>
    </header>
    <table>
      <thead>
        <tr>
          <th>Employee Name</th>
          <th>Extension Number</th>
        </tr>
      </thead>
      <tbody>${tableRows}</tbody>
    </table>
  </main>
</body>
</html>`;
}

function downloadBlob(content, fileName, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export default function EmployeeExtensionsClient() {
  const [employees, setEmployees] = useState([]);
  const [generatedHtml, setGeneratedHtml] = useState("");
  const [nameSearch, setNameSearch] = useState("");
  const [extensionSearch, setExtensionSearch] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef(null);

  const filteredEmployees = useMemo(() => {
    const nameQuery = nameSearch.trim().toLowerCase();
    const extensionQuery = extensionSearch.trim().toLowerCase();

    return employees.filter((employee) => {
      const matchesName = employee.employeeName.toLowerCase().includes(nameQuery);
      const matchesExtension = employee.extensionNumber.toLowerCase().includes(extensionQuery);
      return matchesName && matchesExtension;
    });
  }, [employees, extensionSearch, nameSearch]);

  function resetMessages() {
    setError("");
    setSuccess("");
  }

  function handleTemplateDownload() {
    resetMessages();
    const worksheet = XLSX.utils.json_to_sheet(TEMPLATE_ROWS, {
      header: REQUIRED_HEADERS,
    });
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Employee Extensions");
    XLSX.writeFile(workbook, "employee-extension-template.xlsx");
    setSuccess("Excel template downloaded successfully.");
  }

  async function handleExcelUpload(event) {
    const file = event.target.files?.[0];
    resetMessages();
    setEmployees([]);
    setGeneratedHtml("");

    if (!file) {
      return;
    }

    const fileName = file.name.toLowerCase();
    if (!fileName.endsWith(".xlsx") && !fileName.endsWith(".xls")) {
      setError("Please upload a valid Excel file with .xlsx or .xls format.");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    setIsProcessing(true);

    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: "array" });
      const firstSheetName = workbook.SheetNames[0];

      if (!firstSheetName) {
        throw new Error("The Excel file is empty.");
      }

      const worksheet = workbook.Sheets[firstSheetName];
      const rows = XLSX.utils.sheet_to_json(worksheet, {
        defval: "",
        raw: false,
      });

      if (rows.length === 0) {
        throw new Error("The Excel file is empty.");
      }

      const headers = Object.keys(rows[0] || {}).map((header) => header.trim());
      const missingHeaders = REQUIRED_HEADERS.filter((header) => !headers.includes(header));

      if (missingHeaders.length > 0) {
        throw new Error(
          `Missing required column${missingHeaders.length > 1 ? "s" : ""}: ${missingHeaders.join(", ")}.`
        );
      }

      const parsedEmployees = rows
        .map((row) => ({
          employeeName: normalizeCell(row["Employee Name"]),
          extensionNumber: normalizeCell(row["Extension Number"]),
        }))
        .filter((row) => row.employeeName || row.extensionNumber);

      if (parsedEmployees.length === 0) {
        throw new Error("The Excel file is empty.");
      }

      const html = buildEmployeeHtml(parsedEmployees);
      setEmployees(parsedEmployees);
      setGeneratedHtml(html);
      setSuccess("Excel uploaded and HTML generated successfully.");
    } catch (uploadError) {
      setError(uploadError.message || "Unable to process the Excel file.");
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  function handleHtmlDownload() {
    resetMessages();
    if (!generatedHtml) {
      setError("Upload a valid Excel file before downloading HTML.");
      return;
    }
    downloadBlob(generatedHtml, "index.html", "text/html;charset=utf-8");
    setSuccess("HTML file downloaded successfully.");
  }

  async function handleReplaceHtml() {
    resetMessages();

    if (!generatedHtml) {
      setError("Upload a valid Excel file before replacing an HTML file.");
      return;
    }

    if (!window.showSaveFilePicker && !window.showOpenFilePicker) {
      setError("Your browser does not support the File System Access API.");
      return;
    }

    try {
      let fileHandle;

      if (window.showOpenFilePicker) {
        [fileHandle] = await window.showOpenFilePicker({
          multiple: false,
          types: [
            {
              description: "HTML files",
              accept: { "text/html": [".html"] },
            },
          ],
        });
      } else {
        fileHandle = await window.showSaveFilePicker({
          suggestedName: "index.html",
          types: [
            {
              description: "HTML files",
              accept: { "text/html": [".html"] },
            },
          ],
        });
      }

      if (!fileHandle) {
        throw new Error("No HTML file was selected.");
      }

      const writable = await fileHandle.createWritable();
      await writable.write(generatedHtml);
      await writable.close();
      setSuccess("Selected index.html file replaced successfully.");
    } catch (replaceError) {
      if (replaceError.name === "AbortError") {
        setError("File selection was cancelled.");
      } else {
        setError(replaceError.message || "Unable to replace the selected HTML file.");
      }
    }
  }

  return (
    <div className="grid gap-8">
      <section className="rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-start">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-cyan-700">
              Admin and HR
            </p>
            <h1 className="mt-3 text-3xl font-semibold text-slate-950">
              Employee Extension Manager
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
              Upload an Excel file, preview employee extension numbers, and generate a standalone
              HTML directory entirely in the browser.
            </p>
          </div>
          <div className="rounded-3xl bg-slate-950 px-5 py-4 text-white">
            <p className="text-xs uppercase tracking-[0.25em] text-slate-300">Total Employees</p>
            <p className="mt-2 text-3xl font-semibold">{employees.length}</p>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handleTemplateDownload}
            className="rounded-2xl bg-cyan-500 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400"
          >
            Download Excel Template
          </button>

          <label className="cursor-pointer rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-700">
            {isProcessing ? "Processing..." : "Upload Excel"}
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              onChange={handleExcelUpload}
              className="sr-only"
              disabled={isProcessing}
            />
          </label>

          <button
            type="button"
            onClick={handleHtmlDownload}
            disabled={!generatedHtml || isProcessing}
            className="rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            Download HTML
          </button>

          <button
            type="button"
            onClick={handleReplaceHtml}
            disabled={!generatedHtml || isProcessing}
            className="rounded-2xl bg-orange-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-orange-400 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            Replace Existing HTML
          </button>
        </div>

        {isProcessing ? (
          <p className="mt-5 rounded-2xl border border-cyan-200 bg-cyan-50 px-4 py-3 text-sm text-cyan-800">
            Reading Excel file and generating HTML...
          </p>
        ) : null}

        {error ? (
          <p className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </p>
        ) : null}

        {success ? (
          <p className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {success}
          </p>
        ) : null}
      </section>

      <section className="rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
          <div>
            <h2 className="text-2xl font-semibold text-slate-950">Employee Data Preview</h2>
            <p className="mt-1 text-sm text-slate-500">
              Showing {filteredEmployees.length} of {employees.length} employees.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:min-w-[520px]">
            <label className="grid gap-2">
              <span className="text-sm font-medium text-slate-700">Search by employee name</span>
              <input
                type="search"
                value={nameSearch}
                onChange={(event) => setNameSearch(event.target.value)}
                className="rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-cyan-500"
                placeholder="Employee name"
              />
            </label>
            <label className="grid gap-2">
              <span className="text-sm font-medium text-slate-700">Search by extension number</span>
              <input
                type="search"
                value={extensionSearch}
                onChange={(event) => setExtensionSearch(event.target.value)}
                className="rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-cyan-500"
                placeholder="Extension number"
              />
            </label>
          </div>
        </div>

        <div className="mt-6 overflow-x-auto rounded-2xl border border-slate-200">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                {REQUIRED_HEADERS.map((header) => (
                  <th
                    key={header}
                    className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.25em] text-slate-500"
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {filteredEmployees.map((employee, index) => (
                <tr key={`${employee.employeeName}-${employee.extensionNumber}-${index}`}>
                  <td className="px-6 py-4 text-sm font-semibold text-slate-900">
                    {employee.employeeName}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">
                    {employee.extensionNumber}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {employees.length === 0 ? (
            <div className="px-6 py-12 text-center text-sm text-slate-500">
              Upload a valid Excel file to preview employee extensions.
            </div>
          ) : filteredEmployees.length === 0 ? (
            <div className="px-6 py-12 text-center text-sm text-slate-500">
              No employees match the current search.
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}
