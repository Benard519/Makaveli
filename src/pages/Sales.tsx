import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import SaleForm from '../components/SaleForm';
import { format } from 'date-fns';
import { Plus, Search, Calendar, DollarSign, TrendingUp, CreditCard, Package, Edit, Trash2 } from 'lucide-react';

export default function Sales() {
  const { user } = useAuth();
  const [sales, setSales] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingSale, setEditingSale] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchSales();
  }, [user]);

  const fetchSales = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('sales')
        .select('*')
        .eq('user_id', user.id)
        .order('date_of_sale', { ascending: false });

      if (error) throw error;
      setSales(data || []);
    } catch (error) {
      console.error('Error fetching sales:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (sale: any) => {
    setEditingSale(sale);
    setShowForm(true);
  };

  const handleDelete = async (saleId: string) => {
    if (!confirm('Are you sure you want to delete this sale? This action cannot be undone.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('sales')
        .delete()
        .eq('id', saleId);

      if (error) throw error;
      
      fetchSales();
      alert('Sale deleted successfully!');
    } catch (error) {
      console.error('Error deleting sale:', error);
      alert('Error deleting sale. Please try again.');
    }
  };

  const handleFormSuccess = () => {
    fetchSales();
    setShowForm(false);
    setEditingSale(null);
  };

  const handleFormCancel = () => {
    setShowForm(false);
    setEditingSale(null);
  };

  const filteredSales = sales.filter(sale =>
    sale.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sale.driver_phone.includes(searchTerm) ||
    sale.delivery_method.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (sale.small_comment && sale.small_comment.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (sale.payment_method_sale && sale.payment_method_sale.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const totalSales = sales.reduce((sum, s) => sum + s.total_amount_received, 0);
  const totalQuantity = sales.reduce((sum, s) => sum + s.quantity_sold, 0);
  const totalExpected = sales.reduce((sum, s) => sum + s.amount_paid, 0);
  const totalLaborPayment = sales.reduce((sum, s) => sum + (s.deposited_amount || 0), 0);
  const totalSalesRevenue = sales.reduce((sum, s) => sum + (s.cheque_paid || 0), 0);
  const totalBags = sales.reduce((sum, s) => sum + (s.number_of_bags || 0), 0);
  const netSales = totalSalesRevenue - totalLaborPayment;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-green-200 border-t-green-600 rounded-full animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <TrendingUp className="h-6 w-6 text-green-600 animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-green-800 bg-clip-text text-transparent">
            Sales
          </h1>
          <p className="text-gray-600 mt-1">Track your maize sales and revenue</p>
        </div>
        <button
          onClick={() => {
            setEditingSale(null);
            setShowForm(!showForm);
          }}
          className="mt-4 sm:mt-0 inline-flex items-center px-6 py-3 border border-transparent text-sm font-semibold rounded-xl text-white bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 focus:outline-none focus:ring-4 focus:ring-green-500/50 transition-all duration-300 transform hover:scale-105 shadow-lg"
        >
          <Plus className="h-5 w-5 mr-2" />
          {showForm ? 'Hide Form' : 'Add Sale'}
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6 gap-4 lg:gap-6">
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl p-6 border border-white/20 card-hover">
          <div className="flex items-center">
            <div className="bg-gradient-to-br from-green-500 to-emerald-600 p-4 rounded-2xl shadow-lg">
              <TrendingUp className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4 min-w-0 flex-1">
              <p className="text-xs lg:text-sm font-semibold text-gray-500 truncate">Total Sales</p>
              <p className="text-lg lg:text-xl font-bold text-gray-900 break-words">KES {totalSales.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl p-6 border border-white/20 card-hover">
          <div className="flex items-center">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-4 rounded-2xl shadow-lg">
              <DollarSign className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4 min-w-0 flex-1">
              <p className="text-xs lg:text-sm font-semibold text-gray-500 truncate">Expected Amount</p>
              <p className="text-lg lg:text-xl font-bold text-gray-900 break-words">KES {totalExpected.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl p-6 border border-white/20 card-hover">
          <div className="flex items-center">
            <div className="bg-gradient-to-br from-yellow-500 to-orange-500 p-4 rounded-2xl shadow-lg">
              <CreditCard className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4 min-w-0 flex-1">
              <p className="text-xs lg:text-sm font-semibold text-gray-500 truncate">Labor Payment</p>
              <p className="text-lg lg:text-xl font-bold text-gray-900 break-words">KES {totalLaborPayment.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl p-6 border border-white/20 card-hover">
          <div className="flex items-center">
            <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 p-4 rounded-2xl shadow-lg">
              <TrendingUp className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4 min-w-0 flex-1">
              <p className="text-xs lg:text-sm font-semibold text-gray-500 truncate">Sales Revenue</p>
              <p className="text-lg lg:text-xl font-bold text-gray-900 break-words">KES {totalSalesRevenue.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl p-6 border border-white/20 card-hover">
          <div className="flex items-center">
            <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-4 rounded-2xl shadow-lg">
              <Package className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4 min-w-0 flex-1">
              <p className="text-xs lg:text-sm font-semibold text-gray-500 truncate">Total Quantity</p>
              <p className="text-lg lg:text-xl font-bold text-gray-900 break-words">{totalQuantity.toLocaleString()} kg</p>
            </div>
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl p-6 border border-white/20 card-hover">
          <div className="flex items-center">
            <div className="bg-gradient-to-br from-teal-500 to-teal-600 p-4 rounded-2xl shadow-lg">
              <Package className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4 min-w-0 flex-1">
              <p className="text-xs lg:text-sm font-semibold text-gray-500 truncate">Total Bags</p>
              <p className="text-lg lg:text-xl font-bold text-gray-900 break-words">{totalBags.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl p-6 border border-white/20 card-hover sm:col-span-2 lg:col-span-3 xl:col-span-4 2xl:col-span-6">
          <div className="flex items-center">
            <div className={`bg-gradient-to-br ${netSales >= 0 ? 'from-emerald-500 to-emerald-600' : 'from-red-500 to-red-600'} p-4 rounded-2xl shadow-lg`}>
              <TrendingUp className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4 min-w-0 flex-1">
              <p className="text-xs lg:text-sm font-semibold text-gray-500 truncate">Net Sales</p>
              <p className={`text-lg lg:text-xl font-bold break-words ${netSales >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                KES {netSales >= 0 ? '+' : ''}{netSales.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Sale Form */}
      {showForm && (
        <div className="animate-fadeIn">
          <SaleForm
            editData={editingSale}
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
            placeholder="Search sales by customer name, phone, delivery method, or comments..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-green-500/20 focus:border-green-500 transition-all duration-300 bg-white/50 backdrop-blur-sm"
          />
        </div>
      </div>

      {/* Sales List */}
      <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/20 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-green-50">
          <h3 className="text-lg font-bold text-gray-900">Sales Records</h3>
        </div>
        
        {filteredSales.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <TrendingUp className="h-8 w-8 text-gray-400" />
            </div>
            <p className="text-gray-500 text-lg">No sales found</p>
            <p className="text-gray-400 text-sm">Try adjusting your search terms</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-gray-50 to-green-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                    Driver Phone
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                    Bags
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
                    Expected
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                    Payment Method
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                    Deposited Amount
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                    Cheque Paid
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                    Total Sales
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                    Delivery
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                    Comment
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                    Notes
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {filteredSales.map((sale, index) => (
                  <tr key={sale.id} className="hover:bg-gradient-to-r hover:from-green-50 hover:to-blue-50 transition-all duration-200">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {format(new Date(sale.date_of_sale), 'MMM dd, yyyy')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                      {sale.customer_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-mono">
                      {sale.driver_phone}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex items-center">
                        <Package className="h-4 w-4 text-gray-400 mr-2" />
                        <span className="font-medium">{sale.number_of_bags || 0}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {sale.quantity_sold.toLocaleString()} kg
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      KES {sale.selling_price_per_unit.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-green-600">
                      KES {sale.total_amount_received.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-blue-600">
                      KES {sale.amount_paid.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {sale.payment_method_sale ? (
                        <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
                          sale.payment_method_sale === 'Cash' ? 'bg-green-100 text-green-800' :
                          sale.payment_method_sale === 'M-Pesa' ? 'bg-blue-100 text-blue-800' :
                          sale.payment_method_sale === 'Cheque' ? 'bg-purple-100 text-purple-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {sale.payment_method_sale}
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-orange-600 font-medium">
                      {sale.deposited_amount ? `KES ${sale.deposited_amount.toLocaleString()}` : 'KES 0'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-purple-600 font-medium">
                      {sale.cheque_paid ? `KES ${sale.cheque_paid.toLocaleString()}` : 'KES 0'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold">
                      {(() => {
                        const netAmount = (sale.cheque_paid || 0) - (sale.deposited_amount || 0);
                        return (
                          <span className={netAmount >= 0 ? 'text-green-600' : 'text-red-600'}>
                            KES {netAmount >= 0 ? '+' : ''}{netAmount.toLocaleString()}
                          </span>
                        );
                      })()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
                        sale.delivery_method === 'Delivery' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                      }`}>
                        {sale.delivery_method}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
                        sale.comment === 'Good' ? 'bg-green-100 text-green-800' :
                        sale.comment === 'Poor' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {sale.comment}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 max-w-xs">
                      <div className="truncate" title={sale.small_comment}>
                        {sale.small_comment || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleEdit(sale)}
                          className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-all duration-200"
                          title="Edit sale"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(sale.id)}
                          className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-all duration-200"
                          title="Delete sale"
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