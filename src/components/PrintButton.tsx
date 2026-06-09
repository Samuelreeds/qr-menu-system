import { useState } from 'react';

export default function PrintButton({ order }: { order: any }) {
  const [isPrinting, setIsPrinting] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  const handlePrint = async () => {
    setIsPrinting(true);
    setStatusMessage('Sending to printer...');

    try {
      const response = await fetch('http://192.168.0.139:8080/print', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          table: order.table,
          items: order.items,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to print');
      }

      setStatusMessage('Print successful!');
    } catch (error : any) {
      setStatusMessage(`Error: ${error.message}`);
    } finally {
      setIsPrinting(false);
      // Optional: Clear success message after 3 seconds
      setTimeout(() => setStatusMessage(''), 3000);
    }
  };

  return (
    <div style={{ marginTop: '10px' }}>
      <button 
        onClick={handlePrint} 
        disabled={isPrinting}
        style={{
          padding: '10px 20px',
          backgroundColor: isPrinting ? '#ccc' : '#0070f3',
          color: '#fff',
          border: 'none',
          borderRadius: '5px',
          cursor: isPrinting ? 'not-allowed' : 'pointer'
        }}
      >
        {isPrinting ? 'Printing...' : 'Print Ticket'}
      </button>
      
      {statusMessage && (
        <p style={{ 
          color: statusMessage.includes('Error') ? 'red' : 'green',
          fontSize: '14px',
          marginTop: '8px'
        }}>
          {statusMessage}
        </p>
      )}
    </div>
  );
}