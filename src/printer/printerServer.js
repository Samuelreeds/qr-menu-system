import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import ptp from "pdf-to-printer";
import PDFDocument from "pdfkit";
import { createClient } from "@supabase/supabase-js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- CONFIGURATION ---
const SUPABASE_URL = "https://fqiuwmxdxqrlpmuyxlyw.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... (YOUR SERVICE ROLE KEY)";
const SHOP_ID = "cm0xyz... (THE CUID OF THE CLIENTS SHOP)"; // <-- CRITICAL: RESTRICTS TO ONE SHOP
const PRINTER_NAME = "POS Printer 203DPI Series"; // <-- EXACT WINDOWS PRINTER NAME

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
let isPrinting = false;

async function checkPrintQueue() {
  if (isPrinting) return;

  try {
    // 1. Fetch only THIS shop's pending jobs
    const { data: jobs, error } = await supabase
      .from('PrintJob') 
      .select('*')
      .eq('shopId', SHOP_ID) // SECURITY: Isolated to this shop
      .eq('status', 'pending')
      .order('createdAt', { ascending: true })
      .limit(1);

    if (error) throw error;

    if (jobs && jobs.length > 0) {
      isPrinting = true;
      const job = jobs[0];

      // 2. Atomic Claim: Prevent duplicate printing race conditions
      const { data: claimedJob, error: claimError } = await supabase
        .from('PrintJob')
        .update({ status: 'processing' })
        .eq('id', job.id)
        .eq('status', 'pending') // Only update if still pending
        .select()
        .single();

      if (claimError || !claimedJob) {
        isPrinting = false;
        return; // Another worker claimed it, skip!
      }

      console.log(`\n☁️ Processing job: ${job.id}`);

      // 3. Print
      try {
        await executePrintJob(job.receipt_text);
        await supabase.from('PrintJob').update({ status: 'printed' }).eq('id', job.id);
        console.log(`✅ Job printed successfully!`);
      } catch (printErr) {
        console.error(`❌ Print failed:`, printErr.message);
        await supabase.from('PrintJob').update({ status: 'failed' }).eq('id', job.id);
      }
    }
  } catch (error) {
    console.error("❌ Queue Error:", error.message);
  } finally {
    isPrinting = false;
  }
}

const executePrintJob = (text) => {
  return new Promise((resolve, reject) => {
    const tempPdfPath = path.join(__dirname, `receipt_${Date.now()}.pdf`);
    
    try {
      const doc = new PDFDocument({ margins: { top: 10, bottom: 10, left: 5, right: 5 }, size: [148, 1500] });
      const writeStream = fs.createWriteStream(tempPdfPath);
      doc.pipe(writeStream);
      doc.font("Courier").fontSize(6.5).text(text, { align: "left" });
      doc.end();

      writeStream.on("finish", async () => {
        try {
          await ptp.print(tempPdfPath, { printer: PRINTER_NAME, scale: "noscale" });
          if (fs.existsSync(tempPdfPath)) fs.unlinkSync(tempPdfPath);
          resolve();
        } catch (printErr) {
          if (fs.existsSync(tempPdfPath)) fs.unlinkSync(tempPdfPath);
          reject(new Error(`Windows Spooler Error: ${printErr.message}`));
        }
      });
    } catch (error) {
      reject(new Error(`PDF Error: ${error.message}`));
    }
  });
};

console.log("☁️ Scandine Cloud Print Queue Started!");
console.log(`📡 Listening for Shop ID: ${SHOP_ID}...`);
setInterval(checkPrintQueue, 3000);