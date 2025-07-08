import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { format } from 'date-fns';
import { CheckCircle, Download, Share2, MessageCircle, Mail, Truck, Weight, MapPin } from 'lucide-react';

const schema = yup.object({
  supplier_name: yup.string().required('Supplier name is required'),
  date_of_purchase: yup.string().required('Date is required'),
  quantity_bought: yup.number().positive('Quantity must be positive').required('Quantity is required'),
  price_per_unit: yup.number().positive('Price must be positive').required('Price per unit is required'),
  payment_method: yup.string().required('Payment method is required'),
  truck_number_plate: yup.string(),
  origin_weight: yup.number().positive('Weight must be positive'),
  destination_weight: yup.number().positive('Weight must be positive'),
  location_of_origin: yup.string(),
});

type PurchaseFormData = yup.InferType<typeof schema>;

interface PurchaseFormProps {
  onSuccess?: () => void;
  editData?: any;
  onCancel?: () => void;
}

export default function PurchaseForm({ onSuccess, editData, onCancel }: PurchaseFormProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [lastPurchase, setLastPurchase] = useState<any>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    reset,
  } = useForm<PurchaseFormData>({
    resolver: yupResolver(schema),
    defaultValues: editData ? {
      supplier_name: editData.supplier_name,
      date_of_purchase: editData.date_of_purchase,
      quantity_bought: editData.quantity_bought,
      price_per_unit: editData.price_per_unit,
      payment_method: editData.payment_method,
      truck_number_plate: editData.truck_number_plate || '',
      origin_weight: editData.origin_weight || '',
      destination_weight: editData.destination_weight || '',
      location_of_origin: editData.location_of_origin || '',
    } : {
      date_of_purchase: format(new Date(), 'yyyy-MM-dd'),
    },
  });

  const quantity = watch('quantity_bought');
  const pricePerUnit = watch('price_per_unit');
  const totalAmount = quantity && pricePerUnit ? quantity * pricePerUnit : 0;

  const onSubmit = async (data: PurchaseFormData) => {
    if (!user) return;

    setLoading(true);
    try {
      const purchaseData = {
        ...data,
        total_amount_paid: totalAmount,
        user_id: user.id,
      };

      let result;
      if (editData) {
        const { data: updateResult, error } = await supabase
          .from('purchases')
          .update(purchaseData)
          .eq('id', editData.id)
          .select()
          .single();
        
        if (error) throw error;
        result = updateResult;
      } else {
        const { data: insertResult, error } = await supabase
          .from('purchases')
          .insert([purchaseData])
          .select()
          .single();

        if (error) throw error;
        result = insertResult;
      }

      setLastPurchase(result);
      setShowReceipt(true);
      reset();
      onSuccess?.();
    } catch (error) {
      console.error('Error saving purchase:', error);
      alert('Error saving purchase. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const generateReceipt = () => {
    if (!lastPurchase) return;

    const receipt = `
MAIZEBIZ TRACKER - PURCHASE RECEIPT
================================

Date: ${format(new Date(lastPurchase.date_of_purchase), 'PPP')}
Receipt #: ${lastPurchase.id.substring(0, 8)}

SUPPLIER DETAILS:
Name: ${lastPurchase.supplier_name}
${lastPurchase.location_of_origin ? `Location: ${lastPurchase.location_of_origin}` : ''}

PURCHASE DETAILS:
Quantity: ${lastPurchase.quantity_bought} kg
Price per unit: KES ${lastPurchase.price_per_unit}
Total Amount: KES ${lastPurchase.total_amount_paid}
Payment Method: ${lastPurchase.payment_method}

TRANSPORT DETAILS:
${lastPurchase.truck_number_plate ? `Truck Number: ${lastPurchase.truck_number_plate}` : ''}
${lastPurchase.origin_weight ? `Origin Weight: ${lastPurchase.origin_weight} kg` : ''}
${lastPurchase.destination_weight ? `Destination Weight: ${lastPurchase.destination_weight} kg` : ''}

Thank you for your business!
Generated on: ${format(new Date(), 'PPpp')}
    `;

    const blob = new Blob([receipt], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `purchase-receipt-${lastPurchase.id.substring(0, 8)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const shareReceipt = (method: 'whatsapp' | 'email' | 'sms') => {
    if (!lastPurchase) return;

    const message = `MaizeBiz Purchase Receipt\n\nDate: ${format(new Date(lastPurchase.date_of_purchase), 'PPP')}\nSupplier: ${lastPurchase.supplier_name}${lastPurchase.location_of_origin ? `\nLocation: ${lastPurchase.location_of_origin}` : ''}\nQuantity: ${lastPurchase.quantity_bought} kg\nTotal: KES ${lastPurchase.total_amount_paid}\nPayment: ${lastPurchase.payment_method}${lastPurchase.truck_number_plate ? `\nTruck: ${lastPurchase.truck_number_plate}` : ''}`;

    switch (method) {
      case 'whatsapp':
        window.open(`https://wa.me/?text=${encodeURIComponent(message)}`);
        break;
      case 'email':
        window.open(`mailto:?subject=Purchase Receipt&body=${encodeURIComponent(message)}`);
        break;
      case 'sms':
        window.open(`sms:?body=${encodeURIComponent(message)}`);
        break;
    }
  };

  if (showReceipt) {
    return (
      <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl p-8 border border-white/20 animate-scaleIn">
        <div className="text-center mb-8">
          <div className="h-16 w-16 bg-gradient-to-br from-green-400 to-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl">
            <CheckCircle className="h-8 w-8 text-white" />
          </div>
          <h3 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-green-800 bg-clip-text text-transparent">
            Purchase {editData ? 'Updated' : 'Recorded'} Successfully!
          </h3>
          <p className="text-gray-600 mt-2">Your receipt has been generated and is ready to share</p>
        </div>

        <div className="bg-gradient-to-br from-gray-50 to-green-50 rounded-2xl p-6 mb-8 border border-gray-100">
          <h4 className="font-bold text-gray-900 mb-4 flex items-center">
            <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
            Purchase Details
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="space-y-2">
              <p><span className="font-semibold text-gray-700">Supplier:</span> <span className="text-gray-900">{lastPurchase?.supplier_name}</span></p>
              {lastPurchase?.location_of_origin && (
                <p className="flex items-center"><span className="font-semibold text-gray-700">Location:</span> <MapPin className="h-4 w-4 mx-2 text-gray-500" /> <span className="text-gray-900">{lastPurchase?.location_of_origin}</span></p>
              )}
              <p><span className="font-semibold text-gray-700">Date:</span> <span className="text-gray-900">{format(new Date(lastPurchase?.date_of_purchase), 'PPP')}</span></p>
              <p><span className="font-semibold text-gray-700">Quantity:</span> <span className="text-gray-900">{lastPurchase?.quantity_bought} kg</span></p>
              <p><span className="font-semibold text-gray-700">Price per unit:</span> <span className="text-gray-900">KES {lastPurchase?.price_per_unit}</span></p>
            </div>
            <div className="space-y-2">
              <p><span className="font-semibold text-gray-700">Total Amount:</span> <span className="text-green-600 font-bold">KES {lastPurchase?.total_amount_paid}</span></p>
              <p><span className="font-semibold text-gray-700">Payment Method:</span> <span className="text-gray-900">{lastPurchase?.payment_method}</span></p>
              {lastPurchase?.truck_number_plate && (
                <p className="flex items-center"><span className="font-semibold text-gray-700">Truck Number:</span> <Truck className="h-4 w-4 mx-2 text-gray-500" /> <span className="text-gray-900">{lastPurchase?.truck_number_plate}</span></p>
              )}
              {(lastPurchase?.origin_weight || lastPurchase?.destination_weight) && (
                <div className="flex items-start">
                  <Weight className="h-4 w-4 mt-1 mr-2 text-gray-500" />
                  <div>
                    {lastPurchase?.origin_weight && <p className="text-sm text-gray-900">Origin: {lastPurchase?.origin_weight} kg</p>}
                    {lastPurchase?.destination_weight && <p className="text-sm text-gray-900">Destination: {lastPurchase?.destination_weight} kg</p>}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <button
            onClick={generateReceipt}
            className="flex items-center justify-center px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all duration-300 transform hover:scale-105 shadow-lg"
          >
            <Download className="h-5 w-5 mr-2" />
            Download Receipt
          </button>
          <button
            onClick={() => shareReceipt('whatsapp')}
            className="flex items-center justify-center px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl hover:from-green-600 hover:to-green-700 transition-all duration-300 transform hover:scale-105 shadow-lg"
          >
            <MessageCircle className="h-5 w-5 mr-2" />
            WhatsApp
          </button>
          <button
            onClick={() => shareReceipt('email')}
            className="flex items-center justify-center px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-300 transform hover:scale-105 shadow-lg"
          >
            <Mail className="h-5 w-5 mr-2" />
            Email
          </button>
        </div>

        <div className="text-center">
          <button
            onClick={() => setShowReceipt(false)}
            className="text-gray-600 hover:text-gray-800 font-medium transition-colors duration-200 hover:underline"
          >
            {editData ? 'Close' : 'Add Another Purchase'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl p-8 border border-white/20">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center">
          <div className="h-12 w-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mr-4 shadow-lg">
            <Truck className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-blue-800 bg-clip-text text-transparent">
              {editData ? 'Edit Purchase' : 'Record Purchase'}
            </h2>
            <p className="text-gray-600">{editData ? 'Update purchase details' : 'Add a new purchase to your inventory'}</p>
          </div>
        </div>
        {editData && onCancel && (
          <button
            onClick={onCancel}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium transition-colors duration-200"
          >
            Cancel
          </button>
        )}
      </div>
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="group">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Supplier Name
            </label>
            <input
              type="text"
              {...register('supplier_name')}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 bg-white/50 backdrop-blur-sm group-hover:border-blue-300"
              placeholder="Enter supplier name"
            />
            {errors.supplier_name && (
              <p className="mt-2 text-sm text-red-600 font-medium">{errors.supplier_name.message}</p>
            )}
          </div>

          <div className="group">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Location of Origin
            </label>
            <input
              type="text"
              {...register('location_of_origin')}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 bg-white/50 backdrop-blur-sm group-hover:border-blue-300"
              placeholder="Enter location of origin (optional)"
            />
            {errors.location_of_origin && (
              <p className="mt-2 text-sm text-red-600 font-medium">{errors.location_of_origin.message}</p>
            )}
          </div>

          <div className="group">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Date of Purchase
            </label>
            <input
              type="date"
              {...register('date_of_purchase')}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 bg-white/50 backdrop-blur-sm group-hover:border-blue-300"
            />
            {errors.date_of_purchase && (
              <p className="mt-2 text-sm text-red-600 font-medium">{errors.date_of_purchase.message}</p>
            )}
          </div>

          <div className="group">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Quantity Bought (kg)
            </label>
            <input
              type="number"
              step="0.01"
              {...register('quantity_bought')}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 bg-white/50 backdrop-blur-sm group-hover:border-blue-300"
              placeholder="Enter quantity"
            />
            {errors.quantity_bought && (
              <p className="mt-2 text-sm text-red-600 font-medium">{errors.quantity_bought.message}</p>
            )}
          </div>

          <div className="group">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Price per Unit (KES)
            </label>
            <input
              type="number"
              step="0.01"
              {...register('price_per_unit')}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 bg-white/50 backdrop-blur-sm group-hover:border-blue-300"
              placeholder="Enter price per unit"
            />
            {errors.price_per_unit && (
              <p className="mt-2 text-sm text-red-600 font-medium">{errors.price_per_unit.message}</p>
            )}
          </div>

          <div className="group">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Payment Method
            </label>
            <select
              {...register('payment_method')}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 bg-white/50 backdrop-blur-sm group-hover:border-blue-300"
            >
              <option value="">Select payment method</option>
              <option value="Cash">Cash</option>
              <option value="M-Pesa">M-Pesa</option>
              <option value="Bank Transfer">Bank Transfer</option>
            </select>
            {errors.payment_method && (
              <p className="mt-2 text-sm text-red-600 font-medium">{errors.payment_method.message}</p>
            )}
          </div>

          <div className="group">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Truck Number Plate
            </label>
            <input
              type="text"
              {...register('truck_number_plate')}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 bg-white/50 backdrop-blur-sm group-hover:border-blue-300"
              placeholder="Enter truck number plate (optional)"
            />
            {errors.truck_number_plate && (
              <p className="mt-2 text-sm text-red-600 font-medium">{errors.truck_number_plate.message}</p>
            )}
          </div>

          <div className="group">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Origin Weight (kg)
            </label>
            <input
              type="number"
              step="0.01"
              {...register('origin_weight')}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 bg-white/50 backdrop-blur-sm group-hover:border-blue-300"
              placeholder="Enter origin weight (optional)"
            />
            {errors.origin_weight && (
              <p className="mt-2 text-sm text-red-600 font-medium">{errors.origin_weight.message}</p>
            )}
          </div>

          <div className="group">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Destination Weight (kg)
            </label>
            <input
              type="number"
              step="0.01"
              {...register('destination_weight')}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 bg-white/50 backdrop-blur-sm group-hover:border-blue-300"
              placeholder="Enter destination weight (optional)"
            />
            {errors.destination_weight && (
              <p className="mt-2 text-sm text-red-600 font-medium">{errors.destination_weight.message}</p>
            )}
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Total Amount (KES)
            </label>
            <div className="w-full px-4 py-3 border-2 border-green-200 rounded-xl bg-gradient-to-r from-green-50 to-emerald-50 text-green-800 font-bold text-lg">
              {totalAmount.toLocaleString()}
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-6">
          <button
            type="submit"
            disabled={loading}
            className="px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-500/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 shadow-lg"
          >
            {loading ? (
              <div className="flex items-center space-x-2">
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                <span>{editData ? 'Updating...' : 'Recording...'}</span>
              </div>
            ) : (
              editData ? 'Update Purchase' : 'Record Purchase'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}