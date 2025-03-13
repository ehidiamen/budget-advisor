"use client";

import { useRef, useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send, Mic } from "lucide-react";
import { DataGrid } from "react-data-grid";
import "react-data-grid/lib/styles.css";
import * as XLSX from "xlsx";

export default function Home() {
  const [newMessage, setNewMessage] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [loading, setLoading] = useState(false);
  const recognitionRef = useRef(null);
  const [generated, setGenerated] = useState(null);
  const [excelUrl, setExcelUrl] = useState("");
  const [excelData, setExcelData] = useState([]);
  const chatEndRef = useRef(null); // Reference to the bottom of the page

  // Scroll to the bottom whenever generated content updates
  useEffect(() => {
    if (generated) {
        setNewMessage(""); // Clear input field
        if (chatEndRef.current) {
          chatEndRef.current.scrollIntoView({ behavior: "smooth" });
        }
      }
  }, [generated, excelData]);

  const handleGenerateBudget = async () => {
    setLoading(true);
    setGenerated(null);
    setExcelUrl(null);
    setExcelData([]); 

    try {
        const response = await fetch("https://budgetadvisor.onrender.com/generate_budget", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ prompt: newMessage }),
        });

        const data = await response.json();
        console.log("🔍 API Response:", data);

        if (!response.ok || data.error) {
            throw new Error(data.error || "Failed to generate budget.");
        }

        setGenerated(data.budget || {});  
        setExcelUrl("https://budgetadvisor.onrender.com" + data.excel_url || "");  
    } catch (error) {
        console.error("Error fetching budget:", error);
        setGenerated({ error: error.message });
    } finally {
        setLoading(false);
    }
  };

  const handleSpeech = () => {
    if (!recognitionRef.current) {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            alert("Speech recognition is not supported in this browser.");
            return;
        }
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = false;
        recognitionRef.current.interimResults = false;
        recognitionRef.current.lang = "en-US";

        recognitionRef.current.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            setNewMessage(transcript);
        };

        recognitionRef.current.onend = () => setIsListening(false);
    }

    if (isListening) {
        recognitionRef.current.stop();
        setIsListening(false);
    } else {
        recognitionRef.current.start();
        setIsListening(true);
    }
  };

  // Fetch and display the Excel file as a table
  const fetchAndDisplayExcel = async () => {
    if (!excelUrl) return;

    try {
      const response = await fetch(excelUrl);
      const blob = await response.blob();
      const reader = new FileReader();
      
      reader.onload = (e) => {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const sheet = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { header: 1 });

        const headers = sheet[0];
        const rows = sheet.slice(1).map((row, rowIndex) => {
          const rowObject = {};
          headers.forEach((header, index) => {
            rowObject[header] = row[index] || "";
          });
          return { id: rowIndex, ...rowObject };
        });

        setExcelData(rows);
      };
      
      reader.readAsArrayBuffer(blob);
    } catch (error) {
      console.error("Error fetching Excel file:", error);
    }
  };

  const formatNumberedText = (text) => {
    if (!text) return ""; // Prevents errors if text is missing
  
    const lines = text.split("\n"); // Split text into lines
  
    return (
      <ol className="list-decimal pl-5 space-y-2">
        {lines.map((line, index) => {
          // Detect lines starting with a number (e.g., "1. Step one")
          if (/^\d+\./.test(line.trim())) {
            return <li key={index} className="text-gray-700">{line.trim()}</li>;
          }
          return <p key={index} className="text-gray-600">{line}</p>;
        })}
      </ol>
    );
  };
  

  return (
    <div className="flex flex-col items-center gap-4 p-6 bg-gray-100 min-h-screen">
      
      {/* AI-Generated Budget Section */}
      <div className="w-full max-w-3xl bg-white shadow-md rounded-md p-6">
        <h2 className="text-2xl font-bold text-center text-blue-600">📊 AI-Generated Budget</h2>

        {generated && (
          <div className="mt-4 space-y-4">
            {/* Income */}
            {generated.income !== undefined && (
              <p className="text-lg font-semibold text-green-700">💰 Income: ${generated.income}</p>
            )}

            {/* Expenses */}
            {Array.isArray(generated.expenses) && generated.expenses.length > 0 ? (
              <div className="p-4 bg-gray-50 border-l-4 border-red-500">
                <h3 className="text-lg font-semibold text-red-600">💸 Expenses:</h3>
                <ul className="list-disc pl-5 text-gray-700">
                  {generated.expenses.map((item, index) => (
                    <li key={index}>
                      <span className="font-semibold">{item.category}</span>: ${item.amount}
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <p className="text-gray-500">No expenses listed.</p>
            )}

            {/* Savings */}
            {generated.savings !== undefined && (
              <p className="text-lg font-semibold text-blue-700">💾 Recommended Savings: ${generated.savings}</p>
            )}

            {/* Financial Concerns */}
            {generated.concerns?.content && (
                <div className="p-3 bg-purple-100 border-l-4 border-purple-500">
                    <span className="font-semibold">🔍 Financial Concerns:</span>
                        {formatNumberedText(generated.concerns.content)}
                </div>
            )}

            {/* AI Advice */}
            {generated.advice?.content && (
              <div className="p-3 bg-yellow-100 border-l-4 border-yellow-500">
                <span className="font-semibold">💡 AI Advice:</span>
                    {formatNumberedText(generated.advice.content)}
            </div>
            )}

            

            {/* Download & View Spreadsheet Buttons */}
            {excelUrl && (
              <div className="mt-4 flex justify-center gap-4">
                <a href={excelUrl} download className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600">
                  📥 Download Excel
                </a>
                <button
                  onClick={fetchAndDisplayExcel}
                  className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600"
                >
                  📊 View Spreadsheet
                </button>
              </div>
            )}
          </div>
        )}
      </div>
      {/* Render Spreadsheet Table */}
      {excelData.length > 0 && (
        <div className="mt-4 p-4 bg-white shadow-md border rounded-md">
          <h2 className="text-xl font-bold mb-2 text-center">📄 Budget Spreadsheet</h2>
          <DataGrid
            columns={Object.keys(excelData[0]).map((key) => ({ key, name: key }))}
            rows={excelData}
            rowKeyGetter={(row) => row.id}
            className="rdg-light"
          />
        </div>
      )}
      {/* Invisible div at the bottom for scrolling */}
      <div ref={chatEndRef} />
      {/* Input & Send Button Section */}
      <div className="flex items-center gap-4 w-full max-w-lg bg-white p-4 shadow-md rounded-md">
        <Input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Speak or type your budget details..."
          disabled={loading}
        />
        <Button onClick={handleSpeech} variant={isListening ? "destructive" : "default"}>
          <Mic />
        </Button>
        <Button onClick={handleGenerateBudget} disabled={loading}>
          {loading ? "Generating..." : <Send />}
        </Button>
      </div>
    </div>
  );
}
