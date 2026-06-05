import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import ptp from "pdf-to-printer";
import PDFDocument from "pdfkit";
import { createClient } from "@supabase/supabase-js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- SUPABASE CONNECTION ---
// IMPORTANT: Paste your actual Supabase URL and Anon Key here
const SUPABASE_URL = "https://fqiuwmxdxqrlpmuyxlyw.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZxaXV3bXhkeHFybHBtdXl4bHl3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTE2NTAyNCwiZXhwIjoyMDg2NzQxMDI0fQ.vXPv6inWpJ2IPPF0e98-ZPZ82fuL6yQwgmCmFaUN3so";
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

let isPrinting = false;

// --- THE CLOUD WORKER ---
// --- THE CLOUD WORKER ---
async function checkPrintQueue() {
  if (isPrinting) return;

  try {
    // 1. Look for the oldest pending job (Updated to 'PrintJob')
    const { data: jobs, error } = await supabase
      .from('PrintJob') 
      .select('*')
      .eq('status', 'pending')
      .order('createdAt', { ascending: true }) // Also updated to Prisma's 'createdAt'
      .limit(1);

    if (error) throw error;

    if (jobs && jobs.length > 0) {
      isPrinting = true;
      const job = jobs[0];

      console.log(`\n☁️ Found new cloud print job: ${job.id}`);

      // 2. Lock the job so it doesn't print twice
      await supabase.from('PrintJob').update({ status: 'processing' }).eq('id', job.id);

      // 3. Send to physical printer
      await executePrintJob(job.receipt_text);

      // 4. Mark as finished in the cloud
      await supabase.from('PrintJob').update({ status: 'printed' }).eq('id', job.id);
      console.log(`✅ Job printed successfully!`);
    }
  } catch (error) {
    console.error("❌ Queue Error:", error.message);
  } finally {
    isPrinting = false; // Unlock for the next job
  }
}

// --- THE PHYSICAL PRINTER LOGIC (Optimized for 58mm) ---
const executePrintJob = (text) => {
  return new Promise((resolve, reject) => {
    const tempPdfPath = path.join(__dirname, `receipt_${Date.now()}.pdf`);
    
    try {
      const doc = new PDFDocument({
        margins: { top: 10, bottom: 10, left: 5, right: 5 }, 
        size: [148, 1500], // 58mm width, long height for big orders
      });

      const writeStream = fs.createWriteStream(tempPdfPath);
      doc.pipe(writeStream);

      doc.font("Courier")
         .fontSize(6.5) 
         .text(text, { align: "left" });

      doc.end();

      writeStream.on("finish", async () => {
        try {
          await ptp.print(tempPdfPath, {
            printer: "POS Printer 203DPI Series", // <-- PUT YOUR EXACT PRINTER NAME HERE
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
        reject(new Error(`File Error: ${streamErr.message}`));
      });

    } catch (error) {
      reject(new Error(`PDF Error: ${error.message}`));
    }
  });
};

// --- START THE LOOP ---
console.log("☁️ Scandine Cloud Print Queue Started!");
console.log("📡 Listening to Supabase for pending receipts...");
setInterval(checkPrintQueue, 3000); // Checks the database every 3 seconds