import express from "express";
import cors from "cors";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import ptp from "pdf-to-printer";
import PDFDocument from "pdfkit"; // Required for generating the PDF

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

// --- PRODUCTION PRINT QUEUE ---
// Prevents Windows Print Spooler crashes when multiple tablets send requests
const printQueue = [];
let isPrinting = false;

const processQueue = async () => {
  if (isPrinting || printQueue.length === 0) return;
  
  isPrinting = true;
  const job = printQueue.shift();

  try {
    await executePrintJob(job.text);
    job.resolve();
  } catch (error) {
    job.reject(error);
  } finally {
    isPrinting = false;
    processQueue(); // Instantly trigger the next job
  }
};

const executePrintJob = (text) => {
  return new Promise((resolve, reject) => {
    const tempPdfPath = path.join(__dirname, `receipt_${Date.now()}.pdf`);
    
    try {
      // 1. Shrink canvas to strictly fit a narrow 58mm roll
      const doc = new PDFDocument({
        margins: { top: 10, bottom: 15, left: 5, right: 5 }, 
        size: [148, 800], 
      });

      const writeStream = fs.createWriteStream(tempPdfPath);
      doc.pipe(writeStream);

      // 2. Shrink font size to 6.5 so all 32 characters fit perfectly across
      doc.font("Courier")
         .fontSize(6.5) 
         .text(text, { align: "left" });

      doc.end();

      writeStream.on("finish", async () => {
        try {
          // 3. Send to printer with NO scaling so Windows doesn't stretch it
          await ptp.print(tempPdfPath, {
            printer: "POS Printer 203DPI Series", // <-- MAKE SURE YOUR PRINTER NAME IS HERE
            scale: "noscale"
          });
          
          if (fs.existsSync(tempPdfPath)) fs.unlinkSync(tempPdfPath);
          resolve();
        } catch (printErr) {
          if (fs.existsSync(tempPdfPath)) fs.unlinkSync(tempPdfPath);
          reject(new Error(`Windows Spooler Error: ${printErr.message}`));
        }
      });

      writeStream.on("error", (streamErr) => {
        reject(new Error(`Failed to write PDF file: ${streamErr.message}`));
      });

    } catch (error) {
      reject(new Error(`PDF Generation Error: ${error.message}`));
    }
  });
};

// --- API ENDPOINT ---
app.post("/print", async (req, res) => {
  const { text } = req.body;
  console.log(text);

  if (typeof text !== "string" || !text.trim()) {
    return res.status(400).json({ error: "Valid text payload is required." });
  }

  try {
    // Queue the request and wait for Windows to finish spooling it
    await new Promise((resolve, reject) => {
      printQueue.push({ text: text.trim(), resolve, reject });
      processQueue();
    });

    console.log("✅ Print job sent to Windows Spooler successfully.");
    res.json({ success: true, message: "Printed successfully" });
    
  } catch (error) {
    console.error("❌ Print Failed:", error.message);
    res.status(503).json({ error: error.message });
  }
});

// --- SERVER INITIALIZATION ---
const PORT = process.env.PORT || 3001;

// '0.0.0.0' binds to the local network, allowing tablets to reach the laptop
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🖨 Windows PDF Print Server running on port ${PORT}`);
  console.log(`📡 Ready to receive tablet requests over WiFi`);
  console.log(`⚠️ Make sure 'pdfkit' is installed: npm install pdfkit`);
});