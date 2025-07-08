import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { format } from 'date-fns';
import { CheckCircle, Download, MessageCircle, Mail, TrendingUp, CreditCard, Package } from 'lucide-react';

const schema = yup.object({
  customer_name: yup.string().required('Customer name is required'),
  driver_phone: yup.string().required('Driver phone is required'),
  date_of_sale: yup.string().required('Date is required'),
  quantity_sold: yup.number().positive('Quantity must be positive').required('Quantity is required'),
  number_of_bags: yup.number().positive('Number of bags must be positive'),
  selling_price_per_unit: yup.number().positive('Price must be positive').required('Selling price is required'),
  amount_paid: yup.number().positive('Amount must be positive').required('Expected amount is required'),
  payment_method_sale: yup.string(),
  comment: yup.string().required('Comment is required'),
  delivery_method: yup.string().required('Delivery method is required'),
  deposited_amount: yup.number().min(0, 'Amount must be positive'),
  cheque_paid: yup.number().min(0, 'Amount must be positive'),
  small_comment: yup.string(),
});

type SaleFormData = yup.InferType<typeof schema>;

interface SaleFormProps {
  onSuccess?: () => void;
  editData?: any;
  onCancel?: () => void;
}

export default function SaleForm({ onSuccess, editData, onCancel }: SaleFormProps) {
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
    setValue,
  } = useForm<SaleFormData>({
    resolver: yupResolver(schema),
    defaultValues: editData ? {
      customer_name: editData.customer_name,
      driver_phone: editData.driver_phone,
      date_of_sale: editData.date_of_sale,
      quantity_sold: editData.quantity_sold,
      number_of_bags: editData.number_of_bags || '',
      selling_price_per_unit: editData.selling_price_per_unit,
      amount_paid: editData.amount_paid,
      payment_method_sale: editData.payment_method_sale || '',
      comment: editData.comment,
      delivery_method: editData.delivery_method,
      deposited_amount: editData.deposited_amount || 0,
      cheque_paid: editData.cheque_paid || 0,
      small_comment: editData.small_comment || '',
    } : {
      date_of_sale: format(new Date(), 'yyyy-MM-dd'),
      deposited_amount: 0,
      cheque_paid: 0,
    },
  });

  const quantity = watch('quantity_sold');
  const pricePerUnit = watch('selling_price_per_unit');
  const salesRevenue = watch('cheque_paid');
  const laborPayment = watch('deposited_amount');
  
  // Calculate total amount: cheque paid - deposited amount
  const totalAmount = (salesRevenue || 0) - (laborPayment || 0);

  // Auto-calculate expected amount based on quantity and price (90kg = 1 unit)
  useEffect(() => {
    if (quantity && pricePerUnit) {
      const bags = quantity / 90; // 90 kg = 1 bag
      const expectedAmount = bags * pricePerUnit; // bags × price per unit
      setValue('amount_paid', Math.round(expectedAmount * 100) / 100); // Round to 2 decimal places
    }
  }, [quantity, pricePerUnit, setValue]);

  // Auto-calculate number of bags based on quantity (1 bag = 90 kg)
  useEffect(() => {
    if (quantity) {
      const bags = quantity / 90; // 1 bag = 90 kg
      setValue('number_of_bags', Math.round(bags * 100) / 100); // Round to 2 decimal places
    }
  }, [quantity, setValue]);

  const onSubmit = async (data: SaleFormData) => {
    if (!user) return;

    setLoading(true);
    try {
      // Calculate the correct total amount received
      const calculatedTotal = (data.quantity_sold || 0) * (data.selling_price_per_unit || 0);
      
      const saleData = {
        ...data,
        total_amount_received: calculatedTotal,
        user_id: user.id,
      };

      let result;
      if (editData) {
        const { data: updateResult, error } = await supabase
          .from('sales')
          .update(saleData)
          .eq('id', editData.id)
          .select()
          .single();
        
        if (error) throw error;
        result = updateResult;
      } else {
        const { data: insertResult, error } = await supabase
          .from('sales')
          .insert([saleData])
          .select()
          .single();

        if (error) throw error;
        result = insertResult;
      }

      setLastSale(result);
      setShowReceipt(true);
      if (!editData) {
        reset();
      }
      onSuccess?.();
    } catch (error) {
      console.error('Error saving sale:', error);
      alert('Error saving sale. Please try again.');
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
${lastSale.number_of_bags ? `Number of Bags: ${lastSale.number_of_bags}` : ''}
Price per unit: KES ${lastSale.selling_price_per_unit}
Total Amount: KES ${lastSale.total_amount_received}
Expected Amount: KES ${lastSale.amount_paid}
${lastSale.payment_method_sale ? `Payment Method: ${lastSale.payment_method_sale}` : ''}
Delivery Method: ${lastSale.delivery_method}
Comment: ${lastSale.comment}

PAYMENT DETAILS:
${lastSale.deposited_amount ? `Labor Payment: KES ${lastSale.deposited_amount}` : ''}
${lastSale.cheque_paid ? `Sales Revenue: KES ${lastSale.cheque_paid}` : ''}
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

    const message = `MaizeBiz Sales Receipt\n\nDate: ${format(new Date(lastSale.date_of_sale), 'PPP')}\nCustomer: ${lastSale.customer_name}\nQuantity: ${lastSale.quantity_sold} kg${lastSale.number_of_bags ? `\nBags: ${lastSale.number_of_bags}` : ''}\nTotal: KES ${lastSale.total_amount_received}\nExpected: KES ${lastSale.amount_paid}\nDelivery: ${lastSale.delivery_method}${lastSale.small_comment ? `\nNote: ${lastSale.small_comment}` : ''}`;

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
            Sale {editData ? 'Updated' : 'Recorded'} Successfully!
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
              {lastSale?.number_of_bags && (
                <p className="flex items-center"><span className="font-semibold text-gray-700">Number of Bags:</span> <Package className="h-4 w-4 mx-2 text-gray-500" /> <span className="text-gray-900">{lastSale?.number_of_bags}</span></p>
              )}
              <p><span className="font-semibold text-gray-700">Price per unit:</span> <span className="text-gray-900">KES {lastSale?.selling_price_per_unit}</span></p>
            </div>
            <div className="space-y-2">
              <p><span className="font-semibold text-gray-700">Total Amount:</span> <span className="text-green-600 font-bold">KES {lastSale?.total_amount_received}</span></p>
              <p><span className="font-semibold text-gray-700">Expected Amount:</span> <span className="text-blue-600 font-bold">KES {lastSale?.amount_paid}</span></p>
              {lastSale?.payment_method_sale && (
                <p><span className="font-semibold text-gray-700">Payment Method:</span> <span className="text-gray-900">{lastSale?.payment_method_sale}</span></p>
              )}
              <p><span className="font-semibold text-gray-700">Delivery:</span> <span className="text-gray-900">{lastSale?.delivery_method}</span></p>
              <p><span className="font-semibold text-gray-700">Comment:</span> <span className="text-gray-900">{lastSale?.comment}</span></p>
              {lastSale?.deposited_amount > 0 && (
                <p><span className="font-semibold text-gray-700">Deposited Amount:</span> <span className="text-orange-600">KES {lastSale?.deposited_amount}</span></p>
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
            {editData ? 'Close' : 'Add Another Sale'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl p-8 border border-white/20">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center">
          <div className="h-12 w-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center mr-4 shadow-lg">
            <TrendingUp className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-green-800 bg-clip-text text-transparent">
              {editData ? 'Edit Sale' : 'Record Sale'}
            </h2>
            <p className="text-gray-600">{editData ? 'Update sale details' : 'Add a new sale transaction'}</p>
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
              Number of Bags
              <span className="text-xs text-gray-500 ml-2">(Auto-calculated: 1 bag = 90kg)</span>
            </label>
            <input
              type="number"
              step="0.01"
              {...register('number_of_bags')}
              className="w-full px-4 py-3 border-2 border-purple-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 transition-all duration-300 bg-purple-50/50 backdrop-blur-sm group-hover:border-purple-300"
              placeholder="Auto-calculated based on quantity"
              readOnly
            />
            {errors.number_of_bags && (
              <p className="mt-2 text-sm text-red-600 font-medium">{errors.number_of_bags.message}</p>
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
              Expected Amount (KES)
              <span className="text-xs text-gray-500 ml-2">(Auto-calculated: bags × price per unit)</span>
            </label>
            <input
              type="number"
              step="0.01"
              {...register('amount_paid')}
              className="w-full px-4 py-3 border-2 border-blue-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 bg-blue-50/50 backdrop-blur-sm group-hover:border-blue-300"
              placeholder="Auto-calculated: bags × price per unit"
              readOnly
            />
            {errors.amount_paid && (
              <p className="mt-2 text-sm text-red-600 font-medium">{errors.amount_paid.message}</p>
            )}
          </div>

          <div className="group">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Payment Method
            </label>
            <select
              {...register('payment_method_sale')}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-green-500/20 focus:border-green-500 transition-all duration-300 bg-white/50 backdrop-blur-sm group-hover:border-green-300"
            >
              <option value="">Select payment method (optional)</option>
              <option value="Cash">Cash</option>
              <option value="M-Pesa">M-Pesa</option>
              <option value="Bank Transfer">Bank Transfer</option>
            </select>
            {errors.payment_method_sale && (
              <p className="mt-2 text-sm text-red-600 font-medium">{errors.payment_method_sale.message}</p>
            )}
          </div>

          <div className="group">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Deposited Amount (KES)
              <span className="text-xs text-gray-500 ml-2">(Money paid for labor)</span>
            </label>
            <input
              type="number"
              step="0.01"
              {...register('deposited_amount')}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-green-500/20 focus:border-green-500 transition-all duration-300 bg-white/50 backdrop-blur-sm group-hover:border-green-300"
              placeholder="Enter labor payment amount (optional)"
            />
            {errors.deposited_amount && (
              <p className="mt-2 text-sm text-red-600 font-medium">{errors.deposited_amount.message}</p>
            )}
          </div>

          <div className="group">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Cheque Paid (KES)
              <span className="text-xs text-gray-500 ml-2">(Money received from sales)</span>
            </label>
            <input
              type="number"
              step="0.01"
              {...register('cheque_paid')}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-green-500/20 focus:border-green-500 transition-all duration-300 bg-white/50 backdrop-blur-sm group-hover:border-green-300"
              placeholder="Enter sales revenue amount (optional)"
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
              Total Sales (KES)
              <span className="text-xs text-gray-500 ml-2">(Cheque Paid - Deposited Amount)</span>
            </label>
            <div className={`w-full px-4 py-3 border-2 rounded-xl font-bold text-lg ${
              totalAmount >= 0 
                ? 'border-green-200 bg-gradient-to-r from-green-50 to-emerald-50 text-green-800'
                : 'border-red-200 bg-gradient-to-r from-red-50 to-red-100 text-red-800'
            }`}>
              KES {totalAmount >= 0 ? '+' : ''}{totalAmount.toLocaleString()}
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
                <span>{editData ? 'Updating...' : 'Recording...'}</span>
              </div>
            ) : (
              editData ? 'Update Sale' : 'Record Sale'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}