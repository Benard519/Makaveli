import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import LaborerForm from '../components/LaborerForm';
import { format } from 'date-fns';
import { Plus, Search, Calendar, DollarSign, Users, Calculator, Edit, Trash2 } from 'lucide-react';

export default function Laborers() {
  const { user } = useAuth();
  const [laborers, setLaborers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingLaborer, setEditingLaborer] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchLaborers();
  }, [user]);

  const fetchLaborers = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('laborers')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false });

      if (error) throw error;
      setLaborers(data || []);
    } catch (error) {
      console.error('Error fetching laborers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (laborer: any) => {
    setEditingLaborer(laborer);
    setShowForm(true);
  };

  const handleDelete = async (laborerId: string) => {
    if (!confirm('Are you sure you want to delete this laborer record? This action cannot be undone.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('laborers')
        .delete()
        .eq('id', laborerId);

      if (error) throw error;
      
      fetchLaborers();
      alert('Laborer record deleted successfully!');
    } catch (error) {
      console.error('Error deleting laborer record:', error);
      alert('Error deleting laborer record. Please try again.');
    }
  };

  const handleFormSuccess = () => {
    fetchLaborers();
    setShowForm(false);
    setEditingLaborer(null);
  };

  const handleFormCancel = () => {
    setShowForm(false);
    setEditingLaborer(null);
  };

  const filteredLaborers = laborers.filter(laborer =>
    laborer.date.includes(searchTerm) ||
    laborer.number_of_laborers.toString().includes(searchTerm) ||
    laborer.total_labour.toString().includes(searchTerm) ||
    laborer.price_per_laborer.toString().includes(searchTerm)
  );

  const totalLabourCost = laborers.reduce((sum, l) => sum + l.total_labour, 0);
  const totalLaborers = laborers.reduce((sum, l) => sum + l.number_of_laborers, 0);
  const averagePricePerLaborer = totalLaborers > 0 ? totalLabourCost / totalLaborers : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-orange-200 border-t-orange-600 rounded-full animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <Users className="h-6 w-6 text-orange-600 animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-orange-800 bg-clip-text text-transparent">
            Laborers
          </h1>
          <p className="text-gray-600 mt-1">Manage your laborer payment records</p>
        </div>
        <button
          onClick={() => {
            setEditingLaborer(null);
            setShowForm(!showForm);
          }}
          className="mt-4 sm:mt-0 inline-flex items-center px-6 py-3 border border-transparent text-sm font-semibold rounded-xl text-white bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 focus:outline-none focus:ring-4 focus:ring-orange-500/50 transition-all duration-300 transform hover:scale-105 shadow-lg"
        >
          <Plus className="h-5 w-5 mr-2" />
          {showForm ? 'Hide Form' : 'Add Record'}
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl p-6 border border-white/20 card-hover">
          <div className="flex items-center">
            <div className="bg-gradient-to-br from-orange-500 to-orange-600 p-4 rounded-2xl shadow-lg">
              <DollarSign className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4 min-w-0 flex-1">
              <p className="text-xs lg:text-sm font-semibold text-gray-500 truncate">Total Labour Cost</p>
              <p className="text-lg lg:text-xl font-bold text-gray-900 break-words">KES {totalLabourCost.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl p-6 border border-white/20 card-hover">
          <div className="flex items-center">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-4 rounded-2xl shadow-lg">
              <Users className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4 min-w-0 flex-1">
              <p className="text-xs lg:text-sm font-semibold text-gray-500 truncate">Total Laborers</p>
              <p className="text-lg lg:text-xl font-bold text-gray-900 break-words">{totalLaborers.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl p-6 border border-white/20 card-hover">
          <div className="flex items-center">
            <div className="bg-gradient-to-br from-green-500 to-green-600 p-4 rounded-2xl shadow-lg">
              <Calculator className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4 min-w-0 flex-1">
              <p className="text-xs lg:text-sm font-semibold text-gray-500 truncate">Avg. Price/Laborer</p>
              <p className="text-lg lg:text-xl font-bold text-gray-900 break-words">KES {averagePricePerLaborer.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl p-6 border border-white/20 card-hover">
          <div className="flex items-center">
            <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-4 rounded-2xl shadow-lg">
              <Calendar className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4 min-w-0 flex-1">
              <p className="text-xs lg:text-sm font-semibold text-gray-500 truncate">Total Records</p>
              <p className="text-lg lg:text-xl font-bold text-gray-900 break-words">{laborers.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Laborer Form */}
      {showForm && (
        <div className="animate-fadeIn">
          <LaborerForm
            editData={editingLaborer}
            onSuccess={handleFormSuccess}
            onCancel={handleFormCancel}
          />
        </div>
      )}

      {/* Search Bar */}
      <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg p-4 border border-white/20">
        <div className="relative">
          <Search className="h-5 w-5 absolute left-4 top-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search laborer records by date, number of laborers, or cost..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-orange-500/20 focus:border-orange-500 transition-all duration-300 bg-white/50 backdrop-blur-sm"
          />
        </div>
      </div>

      {/* Laborers List */}
      <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/20 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-orange-50">
          <h3 className="text-lg font-bold text-gray-900">Laborer Payment Records</h3>
        </div>
        
        {filteredLaborers.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Users className="h-8 w-8 text-gray-400" />
            </div>
            <p className="text-gray-500 text-lg">No laborer records found</p>
            <p className="text-gray-400 text-sm">Try adjusting your search terms</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-gray-50 to-orange-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                    Number of Laborers
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                    Price per Laborer
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                    Total Labour Cost
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {filteredLaborers.map((laborer, index) => (
                  <tr key={laborer.id} className="hover:bg-gradient-to-r hover:from-orange-50 hover:to-yellow-50 transition-all duration-200">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {format(new Date(laborer.date), 'MMM dd, yyyy')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex items-center">
                        <Users className="h-4 w-4 text-gray-400 mr-2" />
                        <span className="font-medium">{laborer.number_of_laborers}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      KES {laborer.price_per_laborer.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-orange-600">
                      KES {laborer.total_labour.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleEdit(laborer)}
                          className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-all duration-200"
                          title="Edit laborer record"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(laborer.id)}
                          className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-all duration-200"
                          title="Delete laborer record"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}