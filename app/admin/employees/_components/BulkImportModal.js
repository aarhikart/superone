"use client";

import { useState, useRef } from "react";
import { X, UploadCloud, Download, CheckCircle, AlertCircle, FileSpreadsheet, Loader2, ArrowRight, Trash2 } from "lucide-react";
import * as XLSX from "xlsx";
import Swal from "sweetalert2";

const VALID_DEPARTMENTS = [
  "Engineering",
  "Marketing",
  "Design",
  "Sales",
  "HR",
  "Finance",
  "Operations",
  "Customer Support",
  "Product",
      "UI/UX",
];

function normalizeExcelDate(val) {
  if (val === null || val === undefined || val === "") return "";

  // 1. If it's a number (Excel serial date code)
  if (typeof val === "number") {
    if (XLSX?.SSF?.parse_date_code) {
      const parsed = XLSX.SSF.parse_date_code(val);
      if (parsed && parsed.y && parsed.m && parsed.d) {
        const y = parsed.y;
        const m = String(parsed.m).padStart(2, "0");
        const d = String(parsed.d).padStart(2, "0");
        return `${y}-${m}-${d}`;
      }
    }
  }

  // 2. If it's already a JS Date
  if (val instanceof Date && !isNaN(val.getTime())) {
    // Offset by +12 hours to safely eliminate timezone boundary drift (such as 18:30 UTC = midnight IST)
    const offsetDate = new Date(val.getTime() + 12 * 60 * 60 * 1000);
    const y = offsetDate.getUTCFullYear();
    const m = String(offsetDate.getUTCMonth() + 1).padStart(2, "0");
    const d = String(offsetDate.getUTCDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }

  // 3. If it's a string
  if (typeof val === "string") {
    const s = val.trim();
    if (!s) return "";

    // Format: YYYY-MM-DD or YYYY/MM/DD
    const isoMatch = s.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
    if (isoMatch) {
      const y = isoMatch[1];
      const m = String(isoMatch[2]).padStart(2, "0");
      const d = String(isoMatch[3]).padStart(2, "0");
      return `${y}-${m}-${d}`;
    }

    // Format: MM-DD-YYYY or DD-MM-YYYY
    const slashMatch = s.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})/);
    if (slashMatch) {
      const p1 = parseInt(slashMatch[1], 10);
      const p2 = parseInt(slashMatch[2], 10);
      const y = slashMatch[3];
      let m, d;
      if (p1 > 12) {
        // Must be DD-MM-YYYY
        d = String(p1).padStart(2, "0");
        m = String(p2).padStart(2, "0");
      } else if (p2 > 12) {
        // Must be MM-DD-YYYY
        m = String(p1).padStart(2, "0");
        d = String(p2).padStart(2, "0");
      } else {
        // Default MM-DD-YYYY
        m = String(p1).padStart(2, "0");
        d = String(p2).padStart(2, "0");
      }
      return `${y}-${m}-${d}`;
    }
  }

  return "";
}

export default function BulkImportModal({ isOpen, onClose, onImportSuccess }) {
  const [step, setStep] = useState("select"); // 'select', 'preview', 'importing', 'result'
  const [file, setFile] = useState(null);
  const [parsedData, setParsedData] = useState([]);
  const [validationResults, setValidationResults] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const resetState = () => {
    setStep("select");
    setFile(null);
    setParsedData([]);
    setValidationResults(null);
    setIsProcessing(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const handleFileChange = async (e) => {
    const selected = e.target.files[0];
    if (!selected) return;
    
    if (!selected.name.endsWith('.xlsx') && !selected.name.endsWith('.xls')) {
      Swal.fire({
        icon: "error",
        title: "Invalid File",
        text: "Please upload a valid Excel (.xlsx or .xls) file.",
      });
      return;
    }

    setFile(selected);
    parseExcel(selected);
  };

  const parseExcel = (file) => {
    setIsProcessing(true);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: "array", cellDates: true });
        
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        const json = XLSX.utils.sheet_to_json(worksheet, { defval: "" });
        
        validateData(json);
      } catch (error) {
        console.error("Excel parse error:", error);
        Swal.fire({
          icon: "error",
          title: "Failed to Parse Excel",
          text: "The uploaded file could not be read. Please make sure it is a valid Excel template.",
        });
        resetState();
      } finally {
        setIsProcessing(false);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const validateData = (data) => {
    const validRecords = [];
    const invalidRecords = [];
    let processedCount = 0;
    
    // Clean headers to exact matches based on our template
    data.forEach((row, index) => {
      const rowNum = index + 2; // +1 for 0-index, +1 for header
      
      const emailVal = (row["Email Address*"] || row["Email Address"] || row["Email"] || "").toString().trim();
      const idVal = (row["Employee ID*"] || row["Employee ID"] || "").toString().trim();
      
      // Silently skip the built-in dummy records so they aren't parsed as valid or invalid
      if (
        (emailVal === "john.doe@example.com" && idVal === "EMP-001") ||
        (emailVal === "priya.sharma@example.com" && idVal === "EMP-002") ||
        (emailVal === "jane.smith@example.com" && idVal === "EMP-002")
      ) {
        return;
      }
      
      processedCount++;

      const rawJoining =
        row["Date of Joining* (YYYY-MM-DD)"] ||
        row["Date of Joining (YYYY-MM-DD)"] ||
        row["Date of Joining*"] ||
        row["Date of Joining"] ||
        "";

      const rawDob =
        row["Date of Birth* (YYYY-MM-DD)"] ||
        row["Date of Birth (YYYY-MM-DD)"] ||
        row["Date of Birth*"] ||
        row["Date of Birth"] ||
        "";

      const rawPersonal =
        row["Personal Anniversary (YYYY-MM-DD)"] ||
        row["Personal Anniversary"] ||
        "";

      const normalizedJoining = normalizeExcelDate(rawJoining);
      const normalizedDob = normalizeExcelDate(rawDob);
      const normalizedPersonal = normalizeExcelDate(rawPersonal);

      const record = {
        firstName: (row["First Name*"] || row["First Name"] || "").toString().trim(),
        lastName: (row["Last Name*"] || row["Last Name"] || "").toString().trim(),
        employeeId: idVal,
        email: emailVal,
        phoneNumber: (row["Phone Number*"] || row["Phone Number"] || "").toString().trim(),
        department: (row["Department*"] || row["Department"] || "").toString().trim(),
        jobTitle: (row["Job Title*"] || row["Job Title"] || "").toString().trim(),
        employmentStatus: (row["Employment Status*"] || row["Employment Status"] || "").toString().trim(),
        dateOfJoining: normalizedJoining,
        dateOfBirth: normalizedDob,
        personalAnniversaryDate: normalizedPersonal,
        rawJoining: String(rawJoining),
        rawDob: String(rawDob),
        rowNum,
      };

      const errors = [];

      if (!record.firstName) errors.push({ field: "First Name*", reason: "Required" });
      if (!record.lastName) errors.push({ field: "Last Name*", reason: "Required" });
      if (!record.employeeId) errors.push({ field: "Employee ID*", reason: "Required" });
      
      if (!record.email) {
        errors.push({ field: "Email Address*", reason: "Required" });
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(record.email)) {
        errors.push({ field: "Email Address*", reason: "Invalid format" });
      }

      if (!record.phoneNumber) {
        errors.push({ field: "Phone Number*", reason: "Required" });
      }

      if (!record.department) {
        errors.push({ field: "Department*", reason: "Required" });
      } else if (!VALID_DEPARTMENTS.includes(record.department)) {
        errors.push({
          field: "Department*",
          reason: `Must be one of: ${VALID_DEPARTMENTS.join(", ")}`,
        });
      }

      if (!record.jobTitle) {
        errors.push({ field: "Job Title*", reason: "Required" });
      }

      if (!record.employmentStatus) {
        errors.push({ field: "Employment Status*", reason: "Required" });
      } else if (!["Full-time", "Part-time", "Contract", "Intern"].includes(record.employmentStatus)) {
        errors.push({ field: "Employment Status*", reason: "Must be Full-time, Part-time, Contract, or Intern" });
      }

      if (!record.dateOfJoining) {
        errors.push({ field: "Date of Joining*", reason: "Required (Valid YYYY-MM-DD)" });
      }

      if (!record.dateOfBirth) {
        errors.push({ field: "Date of Birth*", reason: "Required (Valid YYYY-MM-DD)" });
      }

      if (errors.length > 0) {
        invalidRecords.push({ ...record, errors });
      } else {
        validRecords.push(record);
      }
    });

    // Check for duplicates within the valid records
    const emailSet = new Set();
    const idSet = new Set();
    const finalValid = [];
    const duplicateRecords = [];

    validRecords.forEach(record => {
      const emailLower = record.email.toLowerCase();
      if (emailSet.has(emailLower) || idSet.has(record.employeeId)) {
        duplicateRecords.push({ ...record, errors: [{ field: "Email/ID", reason: "Duplicate within file" }] });
      } else {
        emailSet.add(emailLower);
        idSet.add(record.employeeId);
        finalValid.push(record);
      }
    });

    setValidationResults({
      total: processedCount,
      valid: finalValid,
      invalid: [...invalidRecords, ...duplicateRecords],
    });
    setStep("preview");
  };

  const handleImport = async () => {
    if (!validationResults || validationResults.valid.length === 0) return;
    
    setStep("importing");
    try {
      const res = await fetch("/api/employees/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ employees: validationResults.valid }),
      });
      
      const result = await res.json();
      
      if (res.ok) {
        setValidationResults(prev => ({
          ...prev,
          importedCount: result.importedCount,
          dbDuplicates: result.duplicates || []
        }));
        setStep("result");
        if (onImportSuccess) onImportSuccess();
      } else {
        throw new Error(result.error || "Import failed");
      }
    } catch (error) {
      Swal.fire("Import Error", error.message, "error");
      setStep("preview");
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/40 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6">
      <div className="relative w-full max-w-4xl rounded-3xl bg-white shadow-2xl border border-slate-100 flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="px-8 py-5 border-b border-slate-100 flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Bulk Employee Data Import</h2>
            <p className="mt-0.5 text-xs text-slate-500">Upload Excel template to add multiple employees</p>
          </div>
          <button onClick={handleClose} className="rounded-full p-2 text-slate-400 hover:bg-slate-100 transition">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8">
          {/* STEP 1: SELECT FILE */}
          {step === "select" && (
            <div className="max-w-2xl mx-auto flex flex-col items-center">
              <div className="flex gap-4 mb-8 w-full">
                <a href="/api/employees/template" download="Employee_Import_Template.xlsx" className="flex-1 flex flex-col items-center justify-center p-6 rounded-2xl border-2 border-dashed border-indigo-200 bg-indigo-50/50 hover:bg-indigo-50 transition cursor-pointer group">
                  <div className="h-12 w-12 rounded-full bg-white shadow-sm flex items-center justify-center mb-3 group-hover:scale-110 transition">
                    <Download className="h-6 w-6 text-[#00AEEF]" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-800">Download Template</h3>
                  <p className="text-xs text-slate-500 text-center mt-1">Includes 2 dummy employee records & dropdown validation</p>
                </a>
                
                <label className="flex-1 flex flex-col items-center justify-center p-6 rounded-2xl border-2 border-dashed border-emerald-200 bg-emerald-50/50 hover:bg-emerald-50 transition cursor-pointer group">
                  <div className="h-12 w-12 rounded-full bg-white shadow-sm flex items-center justify-center mb-3 group-hover:scale-110 transition">
                    <UploadCloud className="h-6 w-6 text-emerald-600" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-800">Upload Completed File</h3>
                  <p className="text-xs text-slate-500 text-center mt-1">Select your updated .xlsx template</p>
                  <input 
                    type="file" 
                    className="hidden" 
                    accept=".xlsx, .xls" 
                    ref={fileInputRef} 
                    onChange={handleFileChange} 
                    onClick={(e) => { e.target.value = null; }}
                  />
                </label>
              </div>

              <div className="w-full rounded-xl bg-slate-50 border border-slate-200 p-4">
                <h4 className="text-xs font-bold text-slate-800 mb-2 flex items-center gap-1.5"><AlertCircle className="h-4 w-4 text-indigo-500" /> Important Guidelines</h4>
                <ul className="text-xs text-slate-600 list-disc pl-5 space-y-1">
                  <li><strong>2 Dummy Records:</strong> Rows 2 and 3 contain example data (John Doe & Priya Sharma). You can replace them with your actual employees or edit them.</li>
                  <li>Do not change the header column names in row 1.</li>
                  <li>Fields marked with an asterisk (*) are required.</li>
                  <li>Select <strong>Department</strong> and <strong>Employment Status</strong> from the Excel dropdown list.</li>
                  <li>Dates must be entered in <code>YYYY-MM-DD</code> format (e.g. 2026-12-23).</li>
                </ul>
              </div>
            </div>
          )}

          {/* STEP 2: PREVIEW */}
          {step === "preview" && validationResults && (
            <div className="space-y-6">
              <div className="grid grid-cols-4 gap-4">
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-center">
                  <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Total Found</p>
                  <p className="text-2xl font-black text-slate-800">{validationResults.total}</p>
                </div>
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-center">
                  <p className="text-[10px] uppercase font-bold text-emerald-600 tracking-wider">Valid to Import</p>
                  <p className="text-2xl font-black text-emerald-700">{validationResults.valid.length}</p>
                </div>
                <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-center">
                  <p className="text-[10px] uppercase font-bold text-rose-600 tracking-wider">Invalid / Failed</p>
                  <p className="text-2xl font-black text-rose-700">{validationResults.invalid.length}</p>
                </div>
                <button 
                  onClick={handleImport}
                  disabled={validationResults.valid.length === 0}
                  className="rounded-xl border border-[#00AEEF] bg-[#00AEEF] p-4 text-center flex items-center justify-center hover:bg-[#0090c5] disabled:opacity-50 disabled:cursor-not-allowed transition shadow-md shadow-indigo-500/20 text-white group"
                >
                  <div className="flex flex-col items-center">
                    <p className="text-sm font-bold group-hover:scale-105 transition flex items-center gap-2">Import Valid <ArrowRight className="h-4 w-4" /></p>
                  </div>
                </button>
              </div>

              {validationResults.invalid.length > 0 && (
                <div className="rounded-2xl border border-rose-200 bg-white overflow-hidden">
                  <div className="bg-rose-50 px-4 py-3 border-b border-rose-200">
                    <h3 className="text-sm font-bold text-rose-800 flex items-center gap-2"><AlertCircle className="h-4 w-4" /> Validation Errors (Requires Correction)</h3>
                  </div>
                  <div className="max-h-60 overflow-y-auto p-4 space-y-3">
                    {validationResults.invalid.map((rec, i) => (
                      <div key={i} className="rounded-lg bg-slate-50 border border-slate-100 p-3 flex gap-4">
                        <div className="shrink-0 flex items-center justify-center w-10 h-10 rounded-full bg-rose-100 text-rose-600 font-bold text-sm">
                          {rec.rowNum}
                        </div>
                        <div className="flex-1">
                          <p className="text-xs font-semibold text-slate-800 mb-1">{rec.firstName} {rec.lastName} ({rec.email || "No Email"})</p>
                          <div className="space-y-1">
                            {rec.errors.map((err, j) => (
                              <p key={j} className="text-[11px] text-rose-600 flex items-start gap-1">
                                <span className="font-bold shrink-0">{err.field}:</span> {err.reason}
                              </p>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {validationResults.valid.length > 0 && (
                <div className="rounded-2xl border border-emerald-200 bg-white overflow-hidden">
                  <div className="bg-emerald-50 px-4 py-3 border-b border-emerald-200 flex justify-between items-center">
                    <h3 className="text-sm font-bold text-emerald-800 flex items-center gap-2"><CheckCircle className="h-4 w-4" /> Ready to Import</h3>
                    <span className="text-xs text-emerald-600 font-medium">These records passed all checks.</span>
                  </div>
                  <div className="max-h-48 overflow-y-auto">
                    <table className="w-full text-left text-xs text-slate-500">
                      <thead className="bg-slate-50 text-slate-400 sticky top-0 uppercase tracking-wider font-semibold border-b border-slate-100">
                        <tr>
                          <th className="px-4 py-2">Name</th>
                          <th className="px-4 py-2">Email</th>
                          <th className="px-4 py-2">ID</th>
                          <th className="px-4 py-2">Dept</th>
                        </tr>
                      </thead>
                      <tbody>
                        {validationResults.valid.map((rec, i) => (
                          <tr key={i} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50">
                            <td className="px-4 py-2 font-medium text-slate-700">{rec.firstName} {rec.lastName}</td>
                            <td className="px-4 py-2">{rec.email}</td>
                            <td className="px-4 py-2 font-mono">{rec.employeeId}</td>
                            <td className="px-4 py-2">{rec.department || "-"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 3: IMPORTING */}
          {step === "importing" && (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="h-10 w-10 text-[#00AEEF] animate-spin mb-4" />
              <h3 className="text-lg font-bold text-slate-800">Importing Employees...</h3>
              <p className="text-sm text-slate-500">Please wait while we save valid records to the database.</p>
            </div>
          )}

          {/* STEP 4: RESULT */}
          {step === "result" && (
            <div className="flex flex-col items-center justify-center py-10">
              <div className="h-16 w-16 rounded-full bg-emerald-100 flex items-center justify-center mb-4">
                <CheckCircle className="h-8 w-8 text-emerald-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">Import Successful!</h3>
              <p className="text-sm text-slate-500 text-center max-w-md mb-8">
                Successfully imported <strong>{validationResults.importedCount}</strong> employee records into the system.
              </p>
              
              {validationResults.dbDuplicates?.length > 0 && (
                <div className="w-full max-w-lg mb-8 rounded-xl border border-amber-200 bg-amber-50 p-4">
                  <h4 className="text-sm font-bold text-amber-800 flex items-center gap-2 mb-2"><AlertCircle className="h-4 w-4" /> Skipped Duplicates</h4>
                  <p className="text-xs text-amber-700 mb-3">The following records were skipped because the Email or Employee ID already exists in the database:</p>
                  <div className="max-h-32 overflow-y-auto space-y-1">
                    {validationResults.dbDuplicates.map((dup, i) => (
                      <p key={i} className="text-[11px] text-amber-700 font-mono bg-white/50 px-2 py-1 rounded">
                        {dup.email} / {dup.employeeId}
                      </p>
                    ))}
                  </div>
                </div>
              )}
              
              <button onClick={handleClose} className="rounded-full bg-[#00AEEF] px-8 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-500/20 hover:bg-[#0090c5] transition">
                Done & Close
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
