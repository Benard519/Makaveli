import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { format } from 'date-fns';
import { CheckCircle, Download, MessageCircle, Mail, TrendingUp, CreditCard } from 'lucide-react';

const schema = yup.object({
  customer_name: yup.string().required('Customer name is required'),
  driver_phone: yup.string().required('Driver phone is required'),
  date_of_sale: yup.string().required('Date is required'),
  quantity_sold: yup.number().positive('Quantity must be positive').required('Quantity is required'),
  selling_price_per_unit: yup.number().positive('Price must be positive').required('Selling price is required'),
  amount_paid: yup.number().positive('Amount must be positive').required('Amount paid is required'),
  comment: yup.string().required('Comment is required'),
  delivery_method: yup.string().required('Delivery method is required'),
  deposited_amount: yup.number().min(0, 'Amount must be positive'),
  selling_price: yup.number().positive('Selling price must be positive'),
  cheque_paid: yup.number().min(0, 'Amount must be positive'),
  small_comment: yup.string(),
});

type SaleFormData = yup.InferType<typeof schema>;

interface SaleFormProps {
  onSuccess?: () => void;
}

export default function SaleForm({ onSuccess }: SaleFormProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [lastSale, setLastSale] = useState<any>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    reset,
  } = useForm<SaleFormData>({
    resolver: yupResolver(schema),
    defaultValues: {
      date_of_sale: format(new Date(), 'yyyy-MM-dd'),
      deposited_amount: 0,
      cheque_paid: 0,
    },
  });

  const quantity = watch('quantity_sold');
  const pricePerUnit = watch('selling_price_per_unit');
  const totalAmount = quantity && pricePerUnit ? quantity * pricePerUnit : 0;

  const onSubmit = async (data: SaleFormData) => {
    if (!user) return;

    setLoading(true);
    try {
      const saleData = {
        ...data,
        total_amount_received: totalAmount,
        user_id: user.id,
      };

      const { data: result, error } = await supabase
        .from('sales')
        .insert([saleData])
        .select()
        .single();

      if (error) throw error;

      setLastSale(result);
      setShowReceipt(true);
      reset();
      onSuccess?.();
    } catch (error) {
      console.error('Error adding sale:', error);
      alert('Error adding sale. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const generateReceipt = () => {
    if (!lastSale) return;

    const receipt = `
MAIZEBIZ TRACKER - SALES RECEIPT
===============================

Date: ${format(new Date(lastSale.date_of_sale), 'PPP')}
Receipt #: ${lastSale.id.substring(0, 8)}

CUSTOMER DETAILS:
Name: ${lastSale.customer_name}
Driver Phone: ${lastSale.driver_phone}

SALE DETAILS:
Quantity: ${lastSale.quantity_sold} kg
Price per unit: KES ${lastSale.selling_price_per_unit}
Total Amount: KES ${lastSale.total_amount_received}
Amount Paid: KES ${lastSale.amount_paid}
Delivery Method: ${lastSale.delivery_method}
Comment: ${lastSale.comment}

PAYMENT DETAILS:
${lastSale.deposited_amount ? `Deposited Amount: KES ${lastSale.deposited_amount}` : ''}
${lastSale.selling_price ? `Selling Price: KES ${lastSale.selling_price}` : ''}
${lastSale.cheque_paid ? `Cheque Paid: KES ${lastSale.cheque_paid}` : ''}
${lastSale.small_comment ? `Additional Comment: ${lastSale.small_comment}` : ''}

Thank you for your business!
Generated on: ${format(new Date(), 'PPpp')}
    `;

    const blob = new Blob([receipt], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sale-receipt-${lastSale.id.substring(0, 8)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const shareReceipt = (method: 'whatsapp' | 'email' | 'sms') => {
    if (!lastSale) return;

    const message = `MaizeBiz Sales Receipt\n\nDate: ${format(new Date(lastSale.date_of_sale), 'PPP')}\nCustomer: ${lastSale.customer_name}\nQuantity: ${lastSale.quantity_sold} kg\nTotal: KES ${lastSale.total_amount_received}\nPaid: KES ${lastSale.amount_paid}\nDelivery: ${lastSale.delivery_method}${lastSale.small_comment ? `\nNote: ${lastSale.small_comment}` : ''}`;

    switch (method) {
      case 'whatsapp':
        window.open(`https://wa.me/${lastSale.driver_phone}?text=${encodeURIComponent(message)}`);
        break;
      case 'email':
        window.open(`mailto:?subject=Sales Receipt&body=${encodeURIComponent(message)}`);
        break;
      case 'sms':
        window.open(`sms:${lastSale.driver_phone}?body=${encodeURIComponent(message)}`);
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
            Sale Recorded Successfully!
          </h3>
          <p className="text-gray-600 mt-2">Your receipt has been generated and is ready to share</p>
        </div>

        <div className="bg-gradient-to-br from-gray-50 to-green-50 rounded-2xl p-6 mb-8 border border-gray-100">
          <h4 className="font-bold text-gray-900 mb-4 flex items-center">
            <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
            Sale Details
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="space-y-2">
              <p><span className="font-semibold text-gray-700">Customer:</span> <span className="text-gray-900">{lastSale?.customer_name}</span></p>
              <p><span className="font-semibold text-gray-700">Driver Phone:</span> <span className="text-gray-900">{lastSale?.driver_phone}</span></p>
              <p><span className="font-semibold text-gray-700">Date:</span> <span className="text-gray-900">{format(new Date(lastSale?.date_of_sale), 'PPP')}</span></p>
              <p><span className="font-semibold text-gray-700">Quantity:</span> <span className="text-gray-900">{lastSale?.quantity_sold} kg</span></p>
              <p><span className="font-semibold text-gray-700">Price per unit:</span> <span className="text-gray-900">KES {lastSale?.selling_price_per_unit}</span></p>
            </div>
            <div className="space-y-2">
              <p><span className="font-semibold text-gray-700">Total Amount:</span> <span className="text-green-600 font-bold">KES {lastSale?.total_amount_received}</span></p>
              <p><span className="font-semibold text-gray-700">Amount Paid:</span> <span className="text-gray-900">KES {lastSale?.amount_paid}</span></p>
              <p><span className="font-semibold text-gray-700">Delivery:</span> <span className="text-gray-900">{lastSale?.delivery_method}</span></p>
              <p><span className="font-semibold text-gray-700">Comment:</span> <span className="text-gray-900">{lastSale?.comment}</span></p>
              {lastSale?.deposited_amount > 0 && (
                <p><span className="font-semibold text-gray-700">Deposited Amount:</span> <span className="text-blue-600">KES {lastSale?.deposited_amount}</span></p>
              )}
              {lastSale?.selling_price && (
                <p><span className="font-semibold text-gray-700">Selling Price:</span> <span className="text-gray-900">KES {lastSale?.selling_price}</span></p>
              )}
              {lastSale?.cheque_paid > 0 && (
                <p><span className="font-semibold text-gray-700">Cheque Paid:</span> <span className="text-purple-600">KES {lastSale?.cheque_paid}</span></p>
              )}
              {lastSale?.small_comment && (
                <p><span className="font-semibold text-gray-700">Additional Note:</span> <span className="text-gray-900">{lastSale?.small_comment}</span></p>
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
            Add Another Sale
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl p-8 border border-white/20">
      <div className="flex items-center mb-8">
        <div className="h-12 w-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center mr-4 shadow-lg">
          <TrendingUp className="h-6 w-6 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-green-800 bg-clip-text text-transparent">
            Record Sale
          </h2>
          <p className="text-gray-600">Add a new sale transaction</p>
        </div>
      </div>
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="group">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Customer Name
            </label>
            <input
              type="text"
              {...register('customer_name')}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-green-500/20 focus:border-green-500 transition-all duration-300 bg-white/50 backdrop-blur-sm group-hover:border-green-300"
              placeholder="Enter customer name"
            />
            {errors.customer_name && (
              <p className="mt-2 text-sm text-red-600 font-medium">{errors.customer_name.message}</p>
            )}
          </div>

          <div className="group">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Driver Phone Number
            </label>
            <input
              type="tel"
              {...register('driver_phone')}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-green-500/20 focus:border-green-500 transition-all duration-300 bg-white/50 backdrop-blur-sm group-hover:border-green-300"
              placeholder="Enter driver phone number"
            />
            {errors.driver_phone && (
              <p className="mt-2 text-sm text-red-600 font-medium">{errors.driver_phone.message}</p>
            )}
          </div>

          <div className="group">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Date of Sale
            </label>
            <input
              type="date"
              {...register('date_of_sale')}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-green-500/20 focus:border-green-500 transition-all duration-300 bg-white/50 backdrop-blur-sm group-hover:border-green-300"
            />
            {errors.date_of_sale && (
              <p className="mt-2 text-sm text-red-600 font-medium">{errors.date_of_sale.message}</p>
            )}
          </div>

          <div className="group">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Quantity Sold (kg)
            </label>
            <input
              type="number"
              step="0.01"
              {...register('quantity_sold')}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-green-500/20 focus:border-green-500 transition-all duration-300 bg-white/50 backdrop-blur-sm group-hover:border-green-300"
              placeholder="Enter quantity"
            />
            {errors.quantity_sold && (
              <p className="mt-2 text-sm text-red-600 font-medium">{errors.quantity_sold.message}</p>
            )}
          </div>

          <div className="group">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Selling Price per Unit (KES)
            </label>
            <input
              type="number"
              step="0.01"
              {...register('selling_price_per_unit')}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-green-500/20 focus:border-green-500 transition-all duration-300 bg-white/50 backdrop-blur-sm group-hover:border-green-300"
              placeholder="Enter selling price"
            />
            {errors.selling_price_per_unit && (
              <p className="mt-2 text-sm text-red-600 font-medium">{errors.selling_price_per_unit.message}</p>
            )}
          </div>

          <div className="group">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Amount Paid (KES)
            </label>
            <input
              type="number"
              step="0.01"
              {...register('amount_paid')}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-green-500/20 focus:border-green-500 transition-all duration-300 bg-white/50 backdrop-blur-sm group-hover:border-green-300"
              placeholder="Enter amount paid"
            />
            {errors.amount_paid && (
              <p className="mt-2 text-sm text-red-600 font-medium">{errors.amount_paid.message}</p>
            )}
          </div>

          <div className="group">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Deposited Amount (KES)
            </label>
            <input
              type="number"
              step="0.01"
              {...register('deposited_amount')}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-green-500/20 focus:border-green-500 transition-all duration-300 bg-white/50 backdrop-blur-sm group-hover:border-green-300"
              placeholder="Enter deposited amount (optional)"
            />
            {errors.deposited_amount && (
              <p className="mt-2 text-sm text-red-600 font-medium">{errors.deposited_amount.message}</p>
            )}
          </div>

          <div className="group">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Selling Price (KES)
            </label>
            <input
              type="number"
              step="0.01"
              {...register('selling_price')}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-green-500/20 focus:border-green-500 transition-all duration-300 bg-white/50 backdrop-blur-sm group-hover:border-green-300"
              placeholder="Enter selling price (optional)"
            />
            {errors.selling_price && (
              <p className="mt-2 text-sm text-red-600 font-medium">{errors.selling_price.message}</p>
            )}
          </div>

          <div className="group">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Cheque Paid (KES)
            </label>
            <input
              type="number"
              step="0.01"
              {...register('cheque_paid')}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-green-500/20 focus:border-green-500 transition-all duration-300 bg-white/50 backdrop-blur-sm group-hover:border-green-300"
              placeholder="Enter cheque amount (optional)"
            />
            {errors.cheque_paid && (
              <p className="mt-2 text-sm text-red-600 font-medium">{errors.cheque_paid.message}</p>
            )}
          </div>

          <div className="group">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Comment
            </label>
            <select
              {...register('comment')}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-green-500/20 focus:border-green-500 transition-all duration-300 bg-white/50 backdrop-blur-sm group-hover:border-green-300"
            >
              <option value="">Select comment</option>
              <option value="Good">Good</option>
              <option value="Poor">Poor</option>
              <option value="Bad">Bad</option>
            </select>
            {errors.comment && (
              <p className="mt-2 text-sm text-red-600 font-medium">{errors.comment.message}</p>
            )}
          </div>

          <div className="group">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Delivery Method
            </label>
            <select
              {...register('delivery_method')}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-green-500/20 focus:border-green-500 transition-all duration-300 bg-white/50 backdrop-blur-sm group-hover:border-green-300"
            >
              <option value="">Select delivery method</option>
              <option value="Delivery">Delivery</option>
              <option value="Pick-up">Pick-up</option>
            </select>
            {errors.delivery_method && (
              <p className="mt-2 text-sm text-red-600 font-medium">{errors.delivery_method.message}</p>
            )}
          </div>

          <div className="md:col-span-2 group">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Additional Comment
            </label>
            <textarea
              {...register('small_comment')}
              rows={3}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-green-500/20 focus:border-green-500 transition-all duration-300 bg-white/50 backdrop-blur-sm group-hover:border-green-300 resize-none"
              placeholder="Enter additional comments (optional)"
            />
            {errors.small_comment && (
              <p className="mt-2 text-sm text-red-600 font-medium">{errors.small_comment.message}</p>
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
            className="px-8 py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold rounded-xl hover:from-green-700 hover:to-emerald-700 focus:outline-none focus:ring-4 focus:ring-green-500/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 shadow-lg"
          >
            {loading ? (
              <div className="flex items-center space-x-2">
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                <span>Recording...</span>
              </div>
            ) : (
              'Record Sale'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}