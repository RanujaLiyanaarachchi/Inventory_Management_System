import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Badge } from '../ui/badge';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Plus, Edit, Trash2, Search, FileText, Printer, Eye, CalendarIcon, DollarSign, PackageIcon } from 'lucide-react';
import { toast } from "sonner";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose
} from "../ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";

// Import your existing Firebase configuration
import { db } from '../../firebase';
import { collection, doc, setDoc, getDocs, updateDoc, deleteDoc, onSnapshot, query, orderBy } from 'firebase/firestore';

interface GRNItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
}

interface GRN {
  id: string;
  supplier: string;
  supplierId: string;
  date: string;
  status: string;
  total: number;
  items: number;
  notes?: string;
  itemsList?: GRNItem[];
  createdAt?: Date;
  updatedAt?: Date;
}

export function GRN() {
  const [grnList, setGrnList] = useState<GRN[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    supplier: '',
    supplierId: '',
    date: '',
    items: 0,
    total: 0,
    status: 'Pending' as 'Pending' | 'Partial' | 'Received',
    notes: ''
  });
  
  // State for dialog controls
  const [selectedGRN, setSelectedGRN] = useState<GRN | null>(null);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editData, setEditData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Firebase collection reference
  const grnCollectionRef = collection(db, 'grns');

  // Fetch GRNs from Firebase
  useEffect(() => {
    const q = query(grnCollectionRef, orderBy('createdAt', 'desc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const grns: GRN[] = [];
      snapshot.forEach((doc) => {
        grns.push({ id: doc.id, ...doc.data() } as GRN);
      });
      setGrnList(grns);
      setLoading(false);
    }, (error) => {
      console.error('Error fetching GRNs:', error);
      toast.error('Error loading GRN data');
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const filteredGRNs = grnList.filter(grn => {
    const matchesSearch = 
      grn.id.toLowerCase().includes(searchTerm.toLowerCase()) || 
      grn.supplier.toLowerCase().includes(searchTerm.toLowerCase()) ||
      grn.supplierId.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || grn.status.toLowerCase() === statusFilter.toLowerCase();
    return matchesSearch && matchesStatus;
  });

  const generateGRNId = async (): Promise<string> => {
    try {
      const querySnapshot = await getDocs(grnCollectionRef);
      const count = querySnapshot.size + 1;
      return `GRN-${String(count).padStart(3, '0')}`;
    } catch (error) {
      console.error('Error generating GRN ID:', error);
      // Fallback ID if there's an error
      return `GRN-${String(grnList.length + 1).padStart(3, '0')}`;
    }
  };

  const addGRN = async () => {
    if (!formData.supplier || !formData.supplierId || !formData.date || formData.items <= 0 || formData.total <= 0) {
      toast.error('Please fill all required fields');
      return;
    }

    try {
      const grnId = await generateGRNId();
      
      const newGRN: GRN = {
        id: grnId,
        supplier: formData.supplier,
        supplierId: formData.supplierId,
        date: formData.date,
        status: formData.status,
        items: formData.items,
        total: formData.total,
        notes: formData.notes,
        itemsList: [
          {
            id: 'ITEM-001',
            name: 'Sample Item 1',
            quantity: Math.floor(formData.items / 2),
            price: formData.total / formData.items
          },
          {
            id: 'ITEM-002',
            name: 'Sample Item 2',
            quantity: formData.items - Math.floor(formData.items / 2),
            price: formData.total / formData.items
          }
        ],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Use GRN ID as the document ID (primary key)
      const grnDocRef = doc(db, 'grns', grnId);
      await setDoc(grnDocRef, newGRN);

      setShowForm(false);
      setFormData({ 
        supplier: '', 
        supplierId: '', 
        date: '', 
        items: 0, 
        total: 0, 
        status: 'Pending',
        notes: '' 
      });
      toast.success('GRN added successfully');
    } catch (error) {
      console.error('Error adding GRN:', error);
      toast.error('Error adding GRN');
    }
  };

  const updateGRN = async () => {
    if (!editData) return;
    
    if (!editData.supplier || !editData.supplierId || !editData.date) {
      toast.error('Please fill all required fields');
      return;
    }

    try {
      const grnDocRef = doc(db, 'grns', editData.id);
      await updateDoc(grnDocRef, {
        supplier: editData.supplier,
        supplierId: editData.supplierId,
        date: editData.date,
        status: editData.status,
        items: editData.items,
        total: editData.total,
        notes: editData.notes,
        updatedAt: new Date()
      });
      
      setShowEditDialog(false);
      setEditData(null);
      toast.success('GRN updated successfully');
    } catch (error) {
      console.error('Error updating GRN:', error);
      toast.error('Error updating GRN');
    }
  };

  const deleteGRN = async (id: string) => {
    try {
      const grnDocRef = doc(db, 'grns', id);
      await deleteDoc(grnDocRef);
      toast.success('GRN deleted successfully');
    } catch (error) {
      console.error('Error deleting GRN:', error);
      toast.error('Error deleting GRN');
    }
  };

  const handleEdit = (grn: GRN) => {
    setEditData({ ...grn });
    setShowEditDialog(true);
  };

  const handleView = (grn: GRN) => {
    setSelectedGRN(grn);
    setShowViewDialog(true);
  };

  const printGRN = (grn: GRN) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('Please allow pop-ups to print');
      return;
    }

    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>GRN ${grn.id}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              margin: 0;
              padding: 20px;
            }
            .header {
              text-align: center;
              margin-bottom: 20px;
              padding-bottom: 10px;
              border-bottom: 1px solid #ddd;
            }
            .grn-details {
              margin-bottom: 20px;
            }
            .grn-details div {
              margin-bottom: 10px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 20px;
            }
            th, td {
              border: 1px solid #ddd;
              padding: 8px;
              text-align: left;
            }
            th {
              background-color: #f2f2f2;
            }
            .footer {
              text-align: center;
              margin-top: 30px;
              font-size: 12px;
              color: #666;
            }
            .status {
              display: inline-block;
              padding: 5px 10px;
              border-radius: 4px;
              font-size: 12px;
              font-weight: bold;
            }
            .status-received { background-color: #d1fae5; color: #047857; }
            .status-pending { background-color: #f3f4f6; color: #4b5563; }
            .status-partial { background-color: #fef3c7; color: #92400e; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Goods Received Note</h1>
            <h2>${grn.id}</h2>
          </div>
          
          <div class="grn-details">
            <div><strong>Supplier:</strong> ${grn.supplier}</div>
            <div><strong>Supplier ID:</strong> ${grn.supplierId}</div>
            <div><strong>Date:</strong> ${grn.date}</div>
            <div><strong>Status:</strong> <span class="status status-${grn.status.toLowerCase()}">${grn.status}</span></div>
            <div><strong>Total Items:</strong> ${grn.items}</div>
            <div><strong>Total Value:</strong> LKR ${grn.total.toFixed(2)}</div>
            ${grn.notes ? `<div><strong>Notes:</strong> ${grn.notes}</div>` : ''}
          </div>

          ${grn.itemsList ? `
            <h3>Items List</h3>
            <table>
              <thead>
                <tr>
                  <th>Item ID</th>
                  <th>Name</th>
                  <th>Quantity</th>
                  <th>Price</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                ${grn.itemsList.map(item => `
                  <tr>
                    <td>${item.id}</td>
                    <td>${item.name}</td>
                    <td>${item.quantity}</td>
                    <td>LKR ${item.price.toFixed(2)}</td>
                    <td>LKR ${(item.quantity * item.price).toFixed(2)}</td>
                  </tr>
                `).join('')}
                <tr>
                  <td colspan="4" style="text-align: right;"><strong>Grand Total:</strong></td>
                  <td><strong>LKR ${grn.total.toFixed(2)}</strong></td>
                </tr>
              </tbody>
            </table>
          ` : ''}
          
          <div class="footer">
            <p>Printed on ${new Date().toLocaleString()}</p>
            <p>© ${new Date().getFullYear()} Inventory Management System</p>
          </div>
        </body>
      </html>
    `;
    
    printWindow.document.write(printContent);
    printWindow.document.close();
    
    // Add event listener to trigger print when content is loaded
    printWindow.onload = function() {
      setTimeout(() => {
        printWindow.print();
      }, 500);
    };
    
    toast.success('Print preview opened');
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading GRN data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Goods Received Notes (GRN)</h1>
          <p className="text-muted-foreground">Manage and track incoming inventory</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="h-4 w-4 mr-2" />
          Add GRN
        </Button>
      </div>

      {/* Add GRN Form */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>Add New GRN</CardTitle>
            <CardDescription>Fill in the details to add a new GRN</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Supplier Name *</Label>
                <Input
                  value={formData.supplier}
                  onChange={(e) => setFormData(prev => ({ ...prev, supplier: e.target.value }))}
                  placeholder="Enter supplier name"
                />
              </div>
              <div className="space-y-2">
                <Label>Supplier ID *</Label>
                <Input
                  value={formData.supplierId}
                  onChange={(e) => setFormData(prev => ({ ...prev, supplierId: e.target.value }))}
                  placeholder="Enter supplier ID"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Date *</Label>
                <Input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select 
                  value={formData.status} 
                  onValueChange={(value: "Pending" | "Partial" | "Received") => 
                  setFormData(prev => ({ ...prev, status: value }))
                  }
                >
                  <SelectTrigger>
                  <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="Partial">Partial</SelectItem>
                  <SelectItem value="Received">Received</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Items Count *</Label>
                <Input
                  type="number"
                  value={formData.items}
                  onChange={(e) => setFormData(prev => ({ ...prev, items: Number(e.target.value) }))}
                  placeholder="Enter number of items"
                />
              </div>
              <div className="space-y-2">
                <Label>Total Value (LKR) *</Label>
                <Input
                  type="number"
                  value={formData.total}
                  onChange={(e) => setFormData(prev => ({ ...prev, total: Number(e.target.value) }))}
                  placeholder="Enter total value"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Enter any additional notes"
                rows={3}
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button onClick={addGRN}>Add GRN</Button>
              <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search and Filters */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Search & Filters</CardTitle>
          <CardDescription>Find specific GRN records</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative md:col-span-2">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by GRN ID, supplier name or supplier ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="Partial">Partial</SelectItem>
                  <SelectItem value="Received">Received</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* GRN List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            GRN Records
          </CardTitle>
          <CardDescription>
            Showing {filteredGRNs.length} of {grnList.length} records
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border rounded-md overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>GRN ID</TableHead>
                  <TableHead>Supplier</TableHead>
                  <TableHead>Supplier ID</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Items</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredGRNs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      No GRN records found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredGRNs.map(grn => (
                    <TableRow key={grn.id} className="hover:bg-muted/30">
                      <TableCell className="font-medium">{grn.id}</TableCell>
                      <TableCell>{grn.supplier}</TableCell>
                      <TableCell className="font-mono text-sm">{grn.supplierId}</TableCell>
                      <TableCell>{grn.date}</TableCell>
                      <TableCell>
                        <Badge variant={
                          grn.status === 'Received' ? 'default' :
                          grn.status === 'Partial' ? 'secondary' : 'outline'
                        }>
                          {grn.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">{grn.items}</TableCell>
                      <TableCell className="text-right font-medium">LKR {grn.total.toFixed(2)}</TableCell>
                      <TableCell>
                        <div className="flex justify-center gap-1">
                          <Button size="sm" variant="outline" onClick={() => handleView(grn)} title="View GRN">
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => handleEdit(grn)} title="Edit GRN">
                            <Edit className="h-3.5 w-3.5" />
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => printGRN(grn)} title="Print GRN">
                            <Printer className="h-3.5 w-3.5" />
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => deleteGRN(grn.id)} title="Delete GRN">
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* View GRN Dialog */}
      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        <DialogContent className="max-w-5xl p-0 overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-2 h-full">
            {/* Left Side - Main Info */}
            <div className="p-6 border-r border-border">
              {selectedGRN && (
                <div className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 mb-2">
                      <FileText className="h-5 w-5 text-primary" />
                      <h2 className="text-xl font-semibold">GRN Details</h2>
                    </div>
                    
                    <div className="space-y-4">
                      {/* Supplier Section */}
                      <div>
                        <h3 className="font-semibold text-sm flex items-center gap-2 text-muted-foreground">
                          <PackageIcon className="h-4 w-4" />
                          Supplier
                        </h3>
                        <p className="text-base font-medium mt-1">{selectedGRN.supplier}</p>
                        <p className="font-mono text-xs bg-muted px-2 py-0.5 rounded mt-1 inline-block">
                          {selectedGRN.supplierId}
                        </p>
                      </div>
                      
                      {/* GRN Reference Section */}
                      <div>
                        <h3 className="font-semibold text-sm flex items-center gap-2 text-muted-foreground">
                          <FileText className="h-4 w-4" />
                          GRN Reference
                        </h3>
                        <p className="text-base font-medium mt-1 font-mono">{selectedGRN.id}</p>
                      </div>
                      
                      {/* Date Section */}
                      <div>
                        <h3 className="font-semibold text-sm flex items-center gap-2 text-muted-foreground">
                          <CalendarIcon className="h-4 w-4" />
                          Date
                        </h3>
                        <p className="text-base mt-1">{selectedGRN.date}</p>
                      </div>
                      
                      {/* Financial Summary */}
                      <div>
                        <h3 className="font-semibold text-sm flex items-center gap-2 text-muted-foreground">
                          <DollarSign className="h-4 w-4" />
                          Financial Summary
                        </h3>
                        <div className="grid grid-cols-2 gap-2 mt-2 border rounded-md p-2">
                          <div>
                            <span className="text-xs text-muted-foreground">Items:</span>
                            <p className="text-base">{selectedGRN.items}</p>
                          </div>
                          <div>
                            <span className="text-xs text-muted-foreground">Total Value:</span>
                            <p className="text-base font-semibold text-primary">LKR {selectedGRN.total.toFixed(2)}</p>
                          </div>
                        </div>
                      </div>
                      
                      {/* Notes Section */}
                      {selectedGRN.notes && (
                        <div>
                          <h3 className="font-semibold text-sm flex items-center gap-2 text-muted-foreground">
                            <FileText className="h-4 w-4" />
                            Notes
                          </h3>
                          <p className="mt-1 text-sm p-2 bg-muted/30 rounded-md border">
                            {selectedGRN.notes}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Additional Information Tabs */}
                  <div className="mt-6">
                    <Tabs defaultValue="created">
                      <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="created">Created Info</TabsTrigger>
                        <TabsTrigger value="delivery">Delivery</TabsTrigger>
                        <TabsTrigger value="payment">Payment</TabsTrigger>
                      </TabsList>
                      <TabsContent value="created" className="p-3 border rounded-md mt-2">
                        <div className="space-y-1 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Created by:</span>
                            <span>Admin</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Created on:</span>
                            <span>{selectedGRN.date}</span>
                          </div>
                          {selectedGRN.createdAt && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Database Created:</span>
                              <span>{selectedGRN.createdAt.toLocaleDateString()}</span>
                            </div>
                          )}
                        </div>
                      </TabsContent>
                      <TabsContent value="delivery" className="p-3 border rounded-md mt-2">
                        <div className="space-y-1 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Delivery Method:</span>
                            <span>Standard</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Expected Date:</span>
                            <span>{selectedGRN.date}</span>
                          </div>
                        </div>
                      </TabsContent>
                      <TabsContent value="payment" className="p-3 border rounded-md mt-2">
                        <div className="space-y-1 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Payment Terms:</span>
                            <span>Net 30</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Payment Status:</span>
                            <span>Pending</span>
                          </div>
                        </div>
                      </TabsContent>
                    </Tabs>
                  </div>
                  
                  {/* Actions */}
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => printGRN(selectedGRN)} className="flex items-center">
                      <Printer className="h-4 w-4 mr-2" />
                      Print GRN
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleEdit(selectedGRN)} className="flex items-center">
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                    <DialogClose asChild>
                      <Button size="sm">Close</Button>
                    </DialogClose>
                  </div>
                </div>
              )}
            </div>
            
            {/* Right Side - Items List */}
            <div className="p-6 bg-muted/10">
              {selectedGRN && selectedGRN.itemsList && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <PackageIcon className="h-5 w-5 text-primary" />
                      <h2 className="text-xl font-semibold">Items List</h2>
                    </div>
                    <Badge variant="outline" className="font-normal">
                      {selectedGRN.itemsList.length} items
                    </Badge>
                  </div>
                  
                  <div className="border rounded-md bg-background">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/30">
                          <TableHead>Item ID</TableHead>
                          <TableHead>Name</TableHead>
                          <TableHead className="text-right">Quantity</TableHead>
                          <TableHead className="text-right">Price</TableHead>
                          <TableHead className="text-right">Total</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedGRN.itemsList.map((item, index) => (
                          <TableRow key={item.id} className={index % 2 === 0 ? "bg-background" : "bg-muted/10"}>
                            <TableCell className="font-mono text-xs">{item.id}</TableCell>
                            <TableCell className="font-medium">{item.name}</TableCell>
                            <TableCell className="text-right">{item.quantity}</TableCell>
                            <TableCell className="text-right">LKR {item.price.toFixed(2)}</TableCell>
                            <TableCell className="text-right font-medium">
                              LKR {(item.quantity * item.price).toFixed(2)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    
                    {/* Grand Total */}
                    <div className="border-t px-4 py-2 flex justify-end items-center gap-4">
                      <span className="font-medium text-muted-foreground">Grand Total:</span>
                      <span className="font-bold text-primary text-lg">
                        LKR {selectedGRN.total.toFixed(2)}
                      </span>
                    </div>
                  </div>
                  
                  <div className="mt-6">
                    <div className="border rounded-md p-3">
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant={
                          selectedGRN.status === 'Received' ? 'default' :
                          selectedGRN.status === 'Partial' ? 'secondary' : 'outline'
                        } className="px-3 py-1">
                          {selectedGRN.status}
                        </Badge>
                        <div className="text-sm text-muted-foreground">Last updated: Today</div>
                      </div>
                      
                      <div className="text-sm text-muted-foreground">
                        All items in this GRN will be added to your inventory once marked as received.
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit GRN Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="text-xl flex items-center gap-2">
              <Edit className="h-5 w-5" />
              Edit GRN
            </DialogTitle>
            <DialogDescription>
              Update information for GRN {editData?.id}
            </DialogDescription>
          </DialogHeader>
          
          {editData && (
            <div className="space-y-6 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Supplier Name *</Label>
                  <Input
                    value={editData.supplier}
                    onChange={(e) => setEditData({ ...editData, supplier: e.target.value })}
                    placeholder="Enter supplier name"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Supplier ID *</Label>
                  <Input
                    value={editData.supplierId}
                    onChange={(e) => setEditData({ ...editData, supplierId: e.target.value })}
                    placeholder="Enter supplier ID"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Date *</Label>
                  <Input
                    type="date"
                    value={editData.date}
                    onChange={(e) => setEditData({ ...editData, date: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                    <Select 
                    value={editData.status} 
                    onValueChange={(value: "Pending" | "Partial" | "Received") => setEditData({ ...editData, status: value })}
                    >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Pending">Pending</SelectItem>
                      <SelectItem value="Partial">Partial</SelectItem>
                      <SelectItem value="Received">Received</SelectItem>
                    </SelectContent>
                    </Select>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Items Count *</Label>
                  <Input
                    type="number"
                    value={editData.items}
                    onChange={(e) => setEditData({ ...editData, items: Number(e.target.value) })}
                    placeholder="Enter number of items"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Total Value (LKR) *</Label>
                  <Input
                    type="number"
                    value={editData.total}
                    onChange={(e) => setEditData({ ...editData, total: Number(e.target.value) })}
                    placeholder="Enter total value"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea
                  value={editData.notes}
                  onChange={(e) => setEditData({ ...editData, notes: e.target.value })}
                  placeholder="Enter any additional notes"
                  rows={3}
                />
              </div>
            </div>
          )}
          
          <DialogFooter className="flex justify-end gap-2">
            <Button onClick={updateGRN}>
              <Edit className="h-4 w-4 mr-2" />
              Update GRN
            </Button>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}