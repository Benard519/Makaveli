import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import PurchaseForm from '../components/PurchaseForm';
import { format } from 'date-fns';
import { Plus, Search, Calendar, DollarSign, Truck, Weight, Package, Edit, Trash2, MapPin } from 'lucide-react';

export default function Purchases() {
  const { user } = useAuth();
  const [purchases, setPurchases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingPurchase, setEditingPurchase] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchPurchases();
  }, [user]);

  const fetchPurchases = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('purchases')
        .select('*')
        .eq('user_id', user.id)
        .order('date_of_purchase', { ascending: false });

      if (error) throw error;
      setPurchases(data || []);
    } catch (error) {
      console.error('Error fetching purchases:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (purchase: any) => {
    setEditingPurchase(purchase);
    setShowForm(true);
  };

  const handleDelete = async (purchaseId: string) => {
    if (!confirm('Are you sure you want to delete this purchase? This action cannot be undone.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('purchases')
        .delete()
        .eq('id', purchaseId);

      if (error) throw error;
      
      fetchPurchases();
      alert('Purchase deleted successfully!');
    } catch (error) {
      console.error('Error deleting purchase:', error);
      alert('Error deleting purchase. Please try again.');
    }
  };

  const handleFormSuccess = () => {
    fetchPurchases();
    setShowForm(false);
    setEditingPurchase(null);
  };

  const handleFormCancel = () => {
    setShowForm(false);
    setEditingPurchase(null);
  };

  const filteredPurchases = purchases.filter(purchase =>
    purchase.supplier_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    purchase.payment_method.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (purchase.truck_number_plate && purchase.truck_number_plate.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (purchase.location_of_origin && purchase.location_of_origin.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const totalPurchases = purchases.reduce((sum, p) => sum + p.total_amount_paid, 0);
  const totalQuantity = purchases.reduce((sum, p) => sum + p.quantity_bought, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <Package className="h-6 w-6 text-blue-600 animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-blue-800 bg-clip-text text-transparent">
            Purchases
          </h1>
          <p className="text-gray-600 mt-1">Manage your maize purchase records</p>
        </div>
        <button
          onClick={() => {
            setEditingPurchase(null);
            setShowForm(!showForm);
          }}
          className="mt-4 sm:mt-0 inline-flex items-center px-6 py-3 border border-transparent text-sm font-semibold rounded-xl text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-500/50 transition-all duration-300 transform hover:scale-105 shadow-lg"
        >
          <Plus className="h-5 w-5 mr-2" />
          {showForm ? 'Hide Form' : 'Add Purchase'}
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl p-6 border border-white/20 card-hover">
          <div className="flex items-center">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-4 rounded-2xl shadow-lg">
              <DollarSign className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4 min-w-0 flex-1">
              <p className="text-xs lg:text-sm font-semibold text-gray-500 truncate">Total Purchases</p>
              <p className="text-lg lg:text-xl font-bold text-gray-900 break-words">KES {totalPurchases.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl p-6 border border-white/20 card-hover">
          <div className="flex items-center">
            <div className="bg-gradient-to-br from-green-500 to-green-600 p-4 rounded-2xl shadow-lg">
              <Weight className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4 min-w-0 flex-1">
              <p className="text-xs lg:text-sm font-semibold text-gray-500 truncate">Total Quantity</p>
              <p className="text-lg lg:text-xl font-bold text-gray-900 break-words">{totalQuantity.toLocaleString()} kg</p>
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
              <p className="text-lg lg:text-xl font-bold text-gray-900 break-words">{purchases.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Purchase Form */}
      {showForm && (
        <div className="animate-fadeIn">
          <PurchaseForm
            editData={editingPurchase}
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
            placeholder="Search purchases by supplier name, payment method, truck number, or location..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 bg-white/50 backdrop-blur-sm"
          />
        </div>
      </div>

      {/* Purchases List */}
      <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/20 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-blue-50">
          <h3 className="text-lg font-bold text-gray-900">Purchase Records</h3>
        </div>
        
        {filteredPurchases.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Package className="h-8 w-8 text-gray-400" />
            </div>
            <p className="text-gray-500 text-lg">No purchases found</p>
            <p className="text-gray-400 text-sm">Try adjusting your search terms</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-gray-50 to-blue-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                    Supplier
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                    Location
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                    Quantity
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                    Price/Unit
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                    Total
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                    Payment
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                    Truck
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                    Weights
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {filteredPurchases.map((purchase, index) => (
                  <tr key={purchase.id} className="hover:bg-gradient-to-r hover:from-blue-50 hover:to-green-50 transition-all duration-200">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {format(new Date(purchase.date_of_purchase), 'MMM dd, yyyy')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                      {purchase.supplier_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {purchase.location_of_origin ? (
                        <div className="flex items-center">
                          <MapPin className="h-4 w-4 text-gray-400 mr-2" />
                          <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                            {purchase.location_of_origin}
                          </span>
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {purchase.quantity_bought.toLocaleString()} kg
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      KES {purchase.price_per_unit.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-green-600">
                      KES {purchase.total_amount_paid.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
                        purchase.payment_method === 'Cash' ? 'bg-green-100 text-green-800' :
                        purchase.payment_method === 'M-Pesa' ? 'bg-blue-100 text-blue-800' :
                        'bg-purple-100 text-purple-800'
                      }`}>
                        {purchase.payment_method}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {purchase.truck_number_plate ? (
                        <div className="flex items-center">
                          <Truck className="h-4 w-4 text-gray-400 mr-2" />
                          <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">
                            {purchase.truck_number_plate}
                          </span>
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {purchase.origin_weight || purchase.destination_weight ? (
                        <div className="text-xs space-y-1">
                          {purchase.origin_weight && (
                            <div className="flex items-center">
                              <div className="w-2 h-2 bg-blue-400 rounded-full mr-2"></div>
                              <span>Origin: {purchase.origin_weight} kg</span>
                            </div>
                          )}
                          {purchase.destination_weight && (
                            <div className="flex items-center">
                              <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
                              <span>Dest: {purchase.destination_weight} kg</span>
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleEdit(purchase)}
                          className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-all duration-200"
                          title="Edit purchase"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(purchase.id)}
                          className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-all duration-200"
                          title="Delete purchase"
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