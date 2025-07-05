'use client'

import { useState } from 'react';
import { Send } from 'lucide-react';
import Image from 'next/image';

const sampleData = {
  vehicle: {
    year: 2024,
    make: 'Toyota',
    model: 'Camry',
    vin: '1HGCM82633A123456',
    stockNumber: 'TC2024-001',
    price: 32500
  },
  fromStore: 'Forman Ford',
  toStore: 'Forman Mazda',
  requesterName: 'John Smith',
  approverName: 'Jane Doe',
  reason: 'Customer is interested in this specific vehicle'
};

const templates = [
  { value: 'transferRequested', label: 'Transfer Requested' },
  { value: 'transferApproved', label: 'Transfer Approved' },
  { value: 'transferInTransit', label: 'Transfer In Transit' },
  { value: 'transferDelivered', label: 'Transfer Delivered' },
  { value: 'transferCancelled', label: 'Transfer Cancelled' }
];

export default function NotificationPreview() {
  const [selectedTemplate, setSelectedTemplate] = useState('transferRequested');
  const [testEmail, setTestEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const getPreviewContent = () => {
    const baseStyles = `
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      background: white;
    `;

    switch (selectedTemplate) {
      case 'transferRequested':
        return (
          <div style={{ backgroundColor: '#f5f5f5', padding: '20px' }}>
            <div style={{ backgroundColor: 'white', borderRadius: '8px', padding: '20px' }}>
              <h2 style={{ color: '#1f1f1f', marginBottom: '24px' }}>New Transfer Request</h2>
              
              <div style={{ marginBottom: '24px', textAlign: 'center' }}>
                <Image src="https://images.unsplash.com/photo-1616789916664-dce56d9009da?w=600" alt="2024 Toyota Camry" width={600} height={400} style={{ maxWidth: '100%', height: 'auto', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }} />
              </div>
              
              <div style={{ backgroundColor: '#f5f5f5', padding: '20px', borderRadius: '8px', marginBottom: '24px' }}>
                <h3 style={{ color: '#1f1f1f', marginTop: 0 }}>Vehicle Details</h3>
                <p style={{ margin: '8px 0', color: '#4a5568' }}><strong style={{ color: '#1f1f1f' }}>{sampleData.vehicle.year} {sampleData.vehicle.make} {sampleData.vehicle.model}</strong></p>
                <p style={{ margin: '8px 0', color: '#4a5568' }}>VIN: {sampleData.vehicle.vin}</p>
                <p style={{ margin: '8px 0', color: '#4a5568' }}>Stock #: {sampleData.vehicle.stockNumber}</p>
                <p style={{ margin: '8px 0', color: '#4a5568' }}>Price: ${sampleData.vehicle.price.toLocaleString()}</p>
              </div>
              
              <div style={{ backgroundColor: '#e3f2fd', padding: '20px', borderRadius: '8px', marginBottom: '24px' }}>
                <p style={{ margin: '8px 0', color: '#1976d2' }}><strong>{sampleData.requesterName}</strong> from <strong>{sampleData.toStore}</strong> has requested to transfer this vehicle from your location.</p>
              </div>
              
              <div style={{ textAlign: 'center', marginTop: '32px' }}>
                <a href="#" style={{ display: 'inline-block', backgroundColor: '#3b82f6', color: 'white', padding: '12px 24px', textDecoration: 'none', borderRadius: '6px', fontWeight: 500 }}>
                  Review Transfer Request
                </a>
              </div>
              
              <p style={{ color: '#666', fontSize: '14px', marginTop: '32px', textAlign: 'center' }}>
                This is an automated notification from Round Table Inventory Management
              </p>
            </div>
          </div>
        );

      case 'transferApproved':
        return (
          <div style={{ backgroundColor: '#f5f5f5', padding: '20px' }}>
            <div style={{ backgroundColor: 'white', borderRadius: '8px', padding: '20px' }}>
              <h2 style={{ color: '#059669', marginBottom: '24px' }}>✅ Transfer Approved</h2>
              
              <div style={{ marginBottom: '24px', textAlign: 'center' }}>
                <Image src="https://images.unsplash.com/photo-1616789916664-dce56d9009da?w=600" alt="2024 Toyota Camry" width={600} height={400} style={{ maxWidth: '100%', height: 'auto', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }} />
              </div>
              
              <div style={{ backgroundColor: '#f5f5f5', padding: '20px', borderRadius: '8px', marginBottom: '24px' }}>
                <h3 style={{ color: '#1f1f1f', marginTop: 0 }}>Vehicle Details</h3>
                <p style={{ margin: '8px 0', color: '#4a5568' }}><strong style={{ color: '#1f1f1f' }}>{sampleData.vehicle.year} {sampleData.vehicle.make} {sampleData.vehicle.model}</strong></p>
                <p style={{ margin: '8px 0', color: '#4a5568' }}>VIN: {sampleData.vehicle.vin}</p>
                <p style={{ margin: '8px 0', color: '#4a5568' }}>From: {sampleData.fromStore}</p>
              </div>
              
              <div style={{ backgroundColor: '#d1fae5', padding: '20px', borderRadius: '8px', marginBottom: '24px' }}>
                <p style={{ margin: '8px 0', color: '#059669' }}><strong>{sampleData.approverName}</strong> has approved the transfer request.</p>
                <p style={{ margin: '8px 0', color: '#059669' }}>You can now arrange transportation for this vehicle.</p>
              </div>
              
              <div style={{ textAlign: 'center', marginTop: '32px' }}>
                <a href="#" style={{ display: 'inline-block', backgroundColor: '#3b82f6', color: 'white', padding: '12px 24px', textDecoration: 'none', borderRadius: '6px', fontWeight: 500 }}>
                  View Transfer Details
                </a>
              </div>
            </div>
          </div>
        );

      case 'transferInTransit':
        return (
          <div style={{ backgroundColor: '#f5f5f5', padding: '20px' }}>
            <div style={{ backgroundColor: 'white', borderRadius: '8px', padding: '20px' }}>
              <h2 style={{ color: '#f59e0b', marginBottom: '24px' }}>🚚 Vehicle In Transit</h2>
              
              <div style={{ marginBottom: '24px', textAlign: 'center' }}>
                <Image src="https://images.unsplash.com/photo-1616789916664-dce56d9009da?w=600" alt="2024 Toyota Camry" width={600} height={400} style={{ maxWidth: '100%', height: 'auto', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }} />
              </div>
              
              <div style={{ backgroundColor: '#f5f5f5', padding: '20px', borderRadius: '8px', marginBottom: '24px' }}>
                <h3 style={{ color: '#1f1f1f', marginTop: 0 }}>Vehicle Details</h3>
                <p style={{ margin: '8px 0', color: '#4a5568' }}><strong style={{ color: '#1f1f1f' }}>{sampleData.vehicle.year} {sampleData.vehicle.make} {sampleData.vehicle.model}</strong></p>
                <p style={{ margin: '8px 0', color: '#4a5568' }}>VIN: {sampleData.vehicle.vin}</p>
                <p style={{ margin: '8px 0', color: '#4a5568' }}>From: {sampleData.fromStore} → To: {sampleData.toStore}</p>
              </div>
              
              <div style={{ backgroundColor: '#fef3c7', padding: '20px', borderRadius: '8px', marginBottom: '24px' }}>
                <p style={{ margin: '8px 0', color: '#f59e0b' }}>The vehicle is now in transit to your location.</p>
              </div>
            </div>
          </div>
        );

      case 'transferDelivered':
        return (
          <div style={{ backgroundColor: '#f5f5f5', padding: '20px' }}>
            <div style={{ backgroundColor: 'white', borderRadius: '8px', padding: '20px' }}>
              <h2 style={{ color: '#059669', marginBottom: '24px' }}>✅ Vehicle Delivered</h2>
              
              <div style={{ marginBottom: '24px', textAlign: 'center' }}>
                <Image src="https://images.unsplash.com/photo-1616789916664-dce56d9009da?w=600" alt="2024 Toyota Camry" width={600} height={400} style={{ maxWidth: '100%', height: 'auto', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }} />
              </div>
              
              <div style={{ backgroundColor: '#f5f5f5', padding: '20px', borderRadius: '8px', marginBottom: '24px' }}>
                <h3 style={{ color: '#1f1f1f', marginTop: 0 }}>Vehicle Details</h3>
                <p style={{ margin: '8px 0', color: '#4a5568' }}><strong style={{ color: '#1f1f1f' }}>{sampleData.vehicle.year} {sampleData.vehicle.make} {sampleData.vehicle.model}</strong></p>
                <p style={{ margin: '8px 0', color: '#4a5568' }}>VIN: {sampleData.vehicle.vin}</p>
                <p style={{ margin: '8px 0', color: '#4a5568' }}>From: {sampleData.fromStore} → To: {sampleData.toStore}</p>
              </div>
              
              <div style={{ backgroundColor: '#d1fae5', padding: '20px', borderRadius: '8px', marginBottom: '24px' }}>
                <p style={{ margin: '8px 0', color: '#059669' }}>The vehicle has been successfully delivered to your location.</p>
              </div>
            </div>
          </div>
        );

      case 'transferCancelled':
        return (
          <div style={{ backgroundColor: '#f5f5f5', padding: '20px' }}>
            <div style={{ backgroundColor: 'white', borderRadius: '8px', padding: '20px' }}>
              <h2 style={{ color: '#dc2626', marginBottom: '24px' }}>❌ Transfer Cancelled</h2>
              
              <div style={{ marginBottom: '24px', textAlign: 'center' }}>
                <Image src="https://images.unsplash.com/photo-1616789916664-dce56d9009da?w=600" alt="2024 Toyota Camry" width={600} height={400} style={{ maxWidth: '100%', height: 'auto', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }} />
              </div>
              
              <div style={{ backgroundColor: '#f5f5f5', padding: '20px', borderRadius: '8px', marginBottom: '24px' }}>
                <h3 style={{ color: '#1f1f1f', marginTop: 0 }}>Vehicle Details</h3>
                <p style={{ margin: '8px 0', color: '#4a5568' }}><strong style={{ color: '#1f1f1f' }}>{sampleData.vehicle.year} {sampleData.vehicle.make} {sampleData.vehicle.model}</strong></p>
                <p style={{ margin: '8px 0', color: '#4a5568' }}>VIN: {sampleData.vehicle.vin}</p>
                <p style={{ margin: '8px 0', color: '#4a5568' }}>Transfer was: {sampleData.fromStore} → {sampleData.toStore}</p>
              </div>
              
              <div style={{ backgroundColor: '#fee2e2', padding: '20px', borderRadius: '8px', marginBottom: '24px' }}>
                <p style={{ margin: '8px 0', color: '#dc2626' }}>This transfer has been cancelled.</p>
                <p style={{ margin: '8px 0', color: '#dc2626' }}>Reason: {sampleData.reason}</p>
                <p style={{ margin: '8px 0', color: '#dc2626' }}>The vehicle remains at {sampleData.fromStore} and is available for other requests.</p>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const handleSendTest = async () => {
    if (!testEmail) {
      setMessage({ type: 'error', text: 'Please enter an email address' });
      return;
    }

    setSending(true);
    setMessage(null);

    try {
      const response = await fetch('/api/notifications/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: testEmail,
          template: selectedTemplate
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send test email');
      }

      setMessage({ type: 'success', text: 'Test email sent successfully!' });
      setTestEmail('');
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to send test email' });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Template Selector */}
      <div className="bg-[#1f1f1f] border border-[#2a2a2a] rounded-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Select Template to Preview
            </label>
            <select
              value={selectedTemplate}
              onChange={(e) => setSelectedTemplate(e.target.value)}
              className="w-full bg-[#2a2a2a] border border-[#333333] text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {templates.map(template => (
                <option key={template.value} value={template.value}>
                  {template.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Send Test Email To
            </label>
            <div className="flex gap-2">
              <input
                type="email"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                placeholder="test@example.com"
                className="flex-1 bg-[#2a2a2a] border border-[#333333] text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                onClick={handleSendTest}
                disabled={sending || !testEmail}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                <Send className="h-4 w-4" />
                {sending ? 'Sending...' : 'Send'}
              </button>
            </div>
          </div>
        </div>

        {message && (
          <div className={`mt-4 p-3 rounded-lg ${
            message.type === 'success' 
              ? 'bg-green-500/10 border border-green-500/20 text-green-400' 
              : 'bg-red-500/10 border border-red-500/20 text-red-400'
          }`}>
            {message.text}
          </div>
        )}
      </div>

      {/* Email Preview */}
      <div className="bg-[#1f1f1f] border border-[#2a2a2a] rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Email Preview</h3>
        <div className="bg-white rounded-lg overflow-hidden">
          {getPreviewContent()}
        </div>
      </div>
    </div>
  );
}