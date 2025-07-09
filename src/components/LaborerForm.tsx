import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { format } from 'date-fns';
import { CheckCircle, Download, Share2, MessageCircle, Mail, Users, Calculator } from 'lucide-react';

const schema = yup.object({
  date: yup.string().required('Date is required'),
  number_of_laborers: yup.number().positive('Number of laborers must be positive').integer('Must be a whole number').required('Number of laborers is required'),
  total_labour: yup.number().positive('Total labour must be positive').required('Total labour is required'),
  price_per_laborer: yup.number().positive('Price per laborer must be positive').required('Price per laborer is required'),
});

type LaborerFormData = yup.InferType<typeof schema>;

interface LaborerFormProps {
  onSuccess?: () => void;
  editData?: any;
  onCancel?: () => void;
}

export default function LaborerForm({ onSuccess, editData, onCancel }: LaborerFormProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [lastLaborer, setLastLaborer] = useState<any>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    reset,
    setValue,
  } = useForm<LaborerFormData>({
    resolver: yupResolver(schema),
    defaultValues: editData ? {
      date: editData.date,
      number_of_laborers: editData.number_of_laborers,
      total_labour: editData.total_labour,
      price_per_laborer: editData.price_per_laborer,
    } : {
      date: format(new Date(), 'yyyy-MM-dd'),
    },
  });

  const numberOfLaborers = watch('number_of_laborers');
  const totalLabour = watch('total_labour');

  // Auto-calculate price per laborer when total labour and number of laborers are provided
  useEffect(() => {
    if (numberOfLaborers && totalLabour && numberOfLaborers > 0) {
      const pricePerLaborer = totalLabour / numberOfLaborers;
      setValue('price_per_laborer', Math.round(pricePerLaborer * 100) / 100); // Round to 2 decimal places
    }
  }, [numberOfLaborers, totalLabour, setValue]);

  const onSubmit = async (data: LaborerFormData) => {
    if (!user) return;

    setLoading(true);
    try {
      // Ensure all required fields are properly formatted
      const cleanedData = {
        date: data.date || format(new Date(), 'yyyy-MM-dd'),
        number_of_laborers: Number(data.number_of_laborers) || 0,
        price_per_laborer: Number(data.price_per_laborer) || 0,
        total_labour: Number(data.total_labour) || 0,
        user_id: user.id,
      };

      let result;
      if (editData) {
        const { data: updateResult, error } = await supabase
          .from('laborers')
          .update(cleanedData)
          .eq('id', editData.id)
          .select()
          .single();
        
        if (error) throw error;
        result = updateResult;
      } else {
        const { data: insertResult, error } = await supabase
          .from('laborers')
          .insert([cleanedData])
          .select()
          .single();

        if (error) throw error;
        result = insertResult;
      }

      setLastLaborer(result);
      setShowReceipt(true);
      if (!editData) {
        reset({
          date: format(new Date(), 'yyyy-MM-dd'),
          number_of_laborers: 0,
          price_per_laborer: 0,
          total_labour: 0,
        });
      }
      onSuccess?.();
    } catch (error) {
      console.error('Error saving laborer record:', error);
      console.error('Full error object:', error);
      
      let errorMessage = 'Error saving laborer record. Please try again.';
      
      if (error && typeof error === 'object') {
        if ('message' in error) {
          errorMessage = error.message;
        } else if ('error' in error && error.error) {
          errorMessage = error.error.message || error.error;
        } else if ('details' in error) {
          errorMessage = error.details;
        }
      }
      
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const generateReceipt = () => {
    if (!lastLaborer) return;

    const receipt = `
MAIZEBIZ TRACKER - LABORER PAYMENT RECEIPT
=========================================

Date: ${format(new Date(lastLaborer.date), 'PPP')}
Receipt #: ${lastLaborer.id.substring(0, 8)}

LABORER PAYMENT DETAILS:
Number of Laborers: ${lastLaborer.number_of_laborers}
Price per Laborer: KES ${lastLaborer.price_per_laborer}
Total Labour Cost: KES ${lastLaborer.total_labour}

Thank you for your service!
Generated on: ${format(new Date(), 'PPpp')}
    `;

    const blob = new Blob([receipt], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `laborer-receipt-${lastLaborer.id.substring(0, 8)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const shareReceipt = (method: 'whatsapp' | 'email' | 'sms') => {
    if (!lastLaborer) return;

    const message = `MaizeBiz Laborer Payment Receipt\n\nDate: ${format(new Date(lastLaborer.date), 'PPP')}\nLaborers: ${lastLaborer.number_of_laborers}\nPrice per Laborer: KES ${lastLaborer.price_per_laborer}\nTotal: KES ${lastLaborer.total_labour}`;

    switch (method) {
      case 'whatsapp':
        window.open(`https://wa.me/?text=${encodeURIComponent(message)}`);
        break;
      case 'email':
        window.open(`mailto:?subject=Laborer Payment Receipt&body=${encodeURIComponent(message)}`);
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
          <div className="h-16 w-16 bg-gradient-to-br from-orange-400 to-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl">
            <CheckCircle className="h-8 w-8 text-white" />
          </div>
          <h3 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-orange-800 bg-clip-text text-transparent">
            Laborer Record {editData ? 'Updated' : 'Added'} Successfully!
          </h3>
          <p className="text-gray-600 mt-2">Your laborer payment record has been saved</p>
        </div>

        <div className="bg-gradient-to-br from-gray-50 to-orange-50 rounded-2xl p-6 mb-8 border border-gray-100">
          <h4 className="font-bold text-gray-900 mb-4 flex items-center">
            <div className="w-2 h-2 bg-orange-500 rounded-full mr-2"></div>
            Laborer Payment Details
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="space-y-2">
              <p><span className="font-semibold text-gray-700">Date:</span> <span className="text-gray-900">{format(new Date(lastLaborer?.date), 'PPP')}</span></p>
              <p><span className="font-semibold text-gray-700">Number of Laborers:</span> <span className="text-gray-900">{lastLaborer?.number_of_laborers}</span></p>
            </div>
            <div className="space-y-2">
              <p><span className="font-semibold text-gray-700">Price per Laborer:</span> <span className="text-gray-900">KES {lastLaborer?.price_per_laborer}</span></p>
              <p><span className="font-semibold text-gray-700">Total Labour Cost:</span> <span className="text-orange-600 font-bold">KES {lastLaborer?.total_labour}</span></p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <button
            onClick={generateReceipt}
            className="flex items-center justify-center px-6 py-3 bg-gradient-to-r from-orange-600 to-orange-700 text-white rounded-xl hover:from-orange-700 hover:to-orange-800 transition-all duration-300 transform hover:scale-105 shadow-lg"
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
            {editData ? 'Close' : 'Add Another Record'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl p-8 border border-white/20">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center">
          <div className="h-12 w-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center mr-4 shadow-lg">
            <Users className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-orange-800 bg-clip-text text-transparent">
              {editData ? 'Edit Laborer Record' : 'Record Laborer Payment'}
            </h2>
            <p className="text-gray-600">{editData ? 'Update laborer payment details' : 'Add a new laborer payment record'}</p>
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
              Date
            </label>
            <input
              type="date"
              {...register('date', {
                setValueAs: (value) => value || ''
              })}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-orange-500/20 focus:border-orange-500 transition-all duration-300 bg-white/50 backdrop-blur-sm group-hover:border-orange-300"
            />
            {errors.date && (
              <p className="mt-2 text-sm text-red-600 font-medium">{errors.date.message}</p>
            )}
          </div>

          <div className="group">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Number of Laborers
            </label>
            <input
              type="number"
              {...register('number_of_laborers', {
                setValueAs: (value) => value ? parseInt(value) : 0
              })}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-orange-500/20 focus:border-orange-500 transition-all duration-300 bg-white/50 backdrop-blur-sm group-hover:border-orange-300"
              placeholder="Enter number of laborers"
            />
            {errors.number_of_laborers && (
              <p className="mt-2 text-sm text-red-600 font-medium">{errors.number_of_laborers.message}</p>
            )}
          </div>

          <div className="group">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Total Labour Cost (KES)
            </label>
            <input
              type="number"
              step="0.01"
              {...register('total_labour', {
                setValueAs: (value) => value ? parseFloat(value) : 0
              })}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-orange-500/20 focus:border-orange-500 transition-all duration-300 bg-white/50 backdrop-blur-sm group-hover:border-orange-300"
              placeholder="Enter total labour cost"
            />
            {errors.total_labour && (
              <p className="mt-2 text-sm text-red-600 font-medium">{errors.total_labour.message}</p>
            )}
          </div>

          <div className="group">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Price per Laborer (KES)
              <span className="text-xs text-gray-500 ml-2">(Auto-calculated)</span>
            </label>
            <div className="relative">
              <Calculator className="h-5 w-5 absolute left-4 top-4 text-orange-500" />
              <input
                type="number"
                step="0.01"
                {...register('price_per_laborer', {
                  setValueAs: (value) => value ? parseFloat(value) : 0
                })}
                className="w-full pl-12 pr-4 py-3 border-2 border-orange-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-orange-500/20 focus:border-orange-500 transition-all duration-300 bg-orange-50/50 backdrop-blur-sm group-hover:border-orange-300"
                placeholder="Auto-calculated: total ÷ laborers"
                readOnly
              />
            </div>
            {errors.price_per_laborer && (
              <p className="mt-2 text-sm text-red-600 font-medium">{errors.price_per_laborer.message}</p>
            )}
          </div>
        </div>

        <div className="flex justify-end pt-6">
          <button
            type="submit"
            disabled={loading}
            className="px-8 py-4 bg-gradient-to-r from-orange-600 to-orange-700 text-white font-semibold rounded-xl hover:from-orange-700 hover:to-orange-800 focus:outline-none focus:ring-4 focus:ring-orange-500/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 shadow-lg"
          >
            {loading ? (
              <div className="flex items-center space-x-2">
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                <span>{editData ? 'Updating...' : 'Recording...'}</span>
              </div>
            ) : (
              editData ? 'Update Record' : 'Record Payment'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}