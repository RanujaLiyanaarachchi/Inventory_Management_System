import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Badge } from '../ui/badge';
import {
  QrCode, Printer, Download, Scan, Search, Plus, Trash2, Copy, Camera, X, AlertCircle
} from 'lucide-react';
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Checkbox } from "../ui/checkbox";
import JsBarcode from 'jsbarcode';
import { QRCodeSVG } from 'qrcode.react';

// Firebase imports
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  query,
  where,
  orderBy,
  serverTimestamp,
  setDoc
} from 'firebase/firestore';
import { db } from '../../firebase';

// Define barcode formats and their support
const barcodeFormats = [
  { value: 'code128', label: 'Code 128', supports: 'alphanumeric' },
  { value: 'ean13', label: 'EAN-13', supports: 'numeric (12-13 digits)' },
  { value: 'ean8', label: 'EAN-8', supports: 'numeric (7-8 digits)' },
  { value: 'upc', label: 'UPC', supports: 'numeric (11-12 digits)' },
  { value: 'code39', label: 'Code 39', supports: 'alphanumeric + symbols' },
  { value: 'itf14', label: 'ITF-14', supports: 'numeric (13-14 digits)' },
  { value: 'msi', label: 'MSI', supports: 'numeric only' },
  { value: 'pharmacode', label: 'Pharmacode', supports: 'numeric (3-131070)' },
];

interface BarcodeItem {
  id: string;
  content: string;
  format: string;
  product?: string;
  price?: string;
  quantity: number;
  includeLabel: boolean;
  includePrice: boolean;
  includeText: boolean;
  productId?: string;
  createdAt?: any;
  updatedAt?: any;
}

interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  supplier: string;
  costPrice: number;
  sellingPrice: number;
  stock: number;
  minStock: number;
  status: string;
  barcode: string;
  imageUrl: string | null;
  description?: string;
  weight?: string;
  dimensions?: string;
  createdAt?: any;
  updatedAt?: any;
}

export function EnhancedBarcode() {
  // Refs for barcode and QR code rendering
  const barcodeRef = useRef<SVGSVGElement>(null);
  const qrCodeRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // State for barcode settings
  const [barcodeData, setBarcodeData] = useState<BarcodeItem>({
    id: generateId(),
    content: '',
    format: 'code128',
    product: '',
    price: '',
    quantity: 1,
    includeLabel: true,
    includePrice: true,
    includeText: true
  });

  // State for QR code settings
  const [qrCodeData, setQrCodeData] = useState({
    content: '',
    size: 200,
    includeLabel: true,
    logo: false
  });

  // State for scanning
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState('');
  const [activeCamera, setActiveCamera] = useState<MediaStream | null>(null);
  const [availableCameras, setAvailableCameras] = useState<MediaDeviceInfo[]>([]);
  const [selectedCamera, setSelectedCamera] = useState('');

  // State for saved barcodes and products
  const [savedBarcodes, setSavedBarcodes] = useState<BarcodeItem[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Firebase collection references
  const barcodesCollectionRef = collection(db, 'barcodes');
  const productsCollectionRef = collection(db, 'products');

  // Generate a unique ID for barcodes
  function generateId() {
    return `BC-${Math.floor(1000 + Math.random() * 9000)}`;
  }

  // Fetch products from Firebase in real-time
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const q = query(productsCollectionRef, orderBy('createdAt', 'desc'));
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
          const productsData: Product[] = [];
          querySnapshot.forEach((doc) => {
            productsData.push({ id: doc.id, ...doc.data() } as Product);
          });
          setProducts(productsData);
        });

        return () => unsubscribe();
      } catch (error) {
        console.error('Error fetching products:', error);
        toast.error('Error loading products');
      }
    };

    fetchProducts();
  }, []);

  // Fetch barcodes from Firebase in real-time
  useEffect(() => {
    const fetchBarcodes = async () => {
      try {
        setLoading(true);
        const q = query(barcodesCollectionRef, orderBy('createdAt', 'desc'));
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
          const barcodesData: BarcodeItem[] = [];
          querySnapshot.forEach((doc) => {
            barcodesData.push({ id: doc.id, ...doc.data() } as BarcodeItem);
          });
          setSavedBarcodes(barcodesData);
          setLoading(false);
        });

        return () => unsubscribe();
      } catch (error) {
        console.error('Error fetching barcodes:', error);
        toast.error('Error loading barcodes');
        setLoading(false);
      }
    };

    fetchBarcodes();
  }, []);

  // Auto-populate product data when barcode content matches a product
  useEffect(() => {
    if (barcodeData.content) {
      const matchingProduct = products.find(product =>
        product.barcode === barcodeData.content ||
        product.sku === barcodeData.content ||
        product.id === barcodeData.content
      );

      if (matchingProduct) {
        setBarcodeData(prev => ({
          ...prev,
          product: matchingProduct.name,
          price: matchingProduct.sellingPrice.toString(),
          productId: matchingProduct.id
        }));
      }
    }
  }, [barcodeData.content, products]);

  // Function to render barcode
  const renderBarcode = () => {
    if (barcodeRef.current && barcodeData.content) {
      try {
        JsBarcode(barcodeRef.current, barcodeData.content, {
          format: barcodeData.format,
          width: 2,
          height: 100,
          displayValue: barcodeData.includeText,
          text: barcodeData.includeText ? barcodeData.content : '',
          textMargin: 6,
          fontSize: 14,
          margin: 10,
        });
      } catch (error) {
        console.error('Error rendering barcode:', error);
        toast.error('Invalid data for selected barcode format');
      }
    }
  };

  // Handle saving of barcode to Firebase
  const handleSaveBarcode = async () => {
    if (!barcodeData.content) {
      toast.error('Please enter barcode content');
      return;
    }

    try {
      const barcodeDoc = {
        content: barcodeData.content,
        format: barcodeData.format,
        product: barcodeData.product || '',
        price: barcodeData.price || '',
        quantity: barcodeData.quantity,
        includeLabel: barcodeData.includeLabel,
        includePrice: barcodeData.includePrice,
        includeText: barcodeData.includeText,
        productId: barcodeData.productId || '',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      // Save to Firebase
      await addDoc(barcodesCollectionRef, barcodeDoc);

      toast.success('Barcode saved successfully');

      // Reset form with new ID
      setBarcodeData({
        id: generateId(),
        content: '',
        format: 'code128',
        product: '',
        price: '',
        quantity: 1,
        includeLabel: true,
        includePrice: true,
        includeText: true
      });
    } catch (error) {
      console.error('Error saving barcode:', error);
      toast.error('Error saving barcode');
    }
  };

  // Start camera for scanning
  const startCamera = async () => {
    try {
      // Get list of available cameras
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === 'videoinput');
      setAvailableCameras(videoDevices);

      if (videoDevices.length === 0) {
        toast.error('No cameras found on your device');
        return;
      }

      // Use the first camera by default
      const cameraId = selectedCamera || videoDevices[0].deviceId;

      const constraints = {
        video: {
          deviceId: cameraId ? { exact: cameraId } : undefined,
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setActiveCamera(stream);
        setIsScanning(true);
        toast.success('Camera started, point it at a barcode or QR code');
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      toast.error('Could not access the camera. Please check permissions.');
    }
  };

  // Stop camera
  const stopCamera = () => {
    if (activeCamera) {
      activeCamera.getTracks().forEach(track => track.stop());
      setActiveCamera(null);
      setIsScanning(false);
    }
  };

  // Handle camera change
  const handleCameraChange = (deviceId: string) => {
    stopCamera();
    setSelectedCamera(deviceId);
    setTimeout(() => {
      startCamera();
    }, 300);
  };

  // Capture frame and try to decode barcode/QR code
  const captureFrame = () => {
    if (!videoRef.current || !canvasRef.current || !isScanning) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (context && video.readyState === video.HAVE_ENOUGH_DATA) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      toast.info('Scanning for codes...');

      // Simulate scanning for demo purposes
      setTimeout(() => {
        const demoResults = [
          '9780201379624',
          'PROD12345',
          'https://example.com/product/12345',
          '{"id":"12345","name":"Product Name"}'
        ];

        const result = demoResults[Math.floor(Math.random() * demoResults.length)];
        setScanResult(result);
        toast.success('Code detected!');
        stopCamera();
      }, 2000);
    }
  };

  // Use scanned result
  const useScannedResult = () => {
    if (!scanResult) return;

    let isQR = scanResult.startsWith('http') ||
      scanResult.includes('://') ||
      (scanResult.startsWith('{') && scanResult.endsWith('}'));

    if (isQR) {
      setQrCodeData(prev => ({
        ...prev,
        content: scanResult
      }));
      document.querySelector('[data-value="qrcode"]')?.dispatchEvent(
        new MouseEvent('click', { bubbles: true })
      );
    } else {
      setBarcodeData(prev => ({
        ...prev,
        content: scanResult,
        format: scanResult.length === 13 && /^\d+$/.test(scanResult) ? 'ean13' :
          scanResult.length === 8 && /^\d+$/.test(scanResult) ? 'ean8' : 'code128'
      }));
      document.querySelector('[data-value="barcode"]')?.dispatchEvent(
        new MouseEvent('click', { bubbles: true })
      );
    }

    setScanResult('');
  };

  // Handle printing of barcode
  const handlePrintBarcode = (barcode = barcodeData) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('Please allow pop-ups to print the barcode');
      return;
    }

    const barcodeHTML = `
      <html>
        <head>
          <title>Print Barcode</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              margin: 0;
              padding: 20px;
              text-align: center;
            }
            .barcode-container {
              display: inline-block;
              margin: 10px;
              padding: 10px;
              border: 1px dashed #ccc;
              page-break-inside: avoid;
            }
            .product-name {
              font-size: 14px;
              font-weight: bold;
              margin-bottom: 5px;
            }
            .price {
              font-size: 14px;
              margin-top: 5px;
            }
            @media print {
              body { margin: 0; padding: 0; }
              .barcode-container { border: none; }
              @page { margin: 0.5cm; }
            }
          </style>
        </head>
        <body>
          ${Array(barcode.quantity).fill(0).map(() => `
            <div class="barcode-container">
              ${barcode.includeLabel && barcode.product ? `<div class="product-name">${barcode.product}</div>` : ''}
              <div class="barcode">
                <svg class="barcode-svg"></svg>
              </div>
              ${barcode.includePrice && barcode.price ? `<div class="price">LKR ${barcode.price}</div>` : ''}
            </div>
          `).join('')}
          <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js"></script>
          <script>
            document.querySelectorAll('.barcode-svg').forEach(svg => {
              JsBarcode(svg, "${barcode.content}", {
                format: "${barcode.format}",
                width: 2,
                height: 80,
                displayValue: ${barcode.includeText},
                text: ${barcode.includeText ? `"${barcode.content}"` : '""'},
                textMargin: 6,
                fontSize: 14,
                margin: 10
              });
            });
            window.onload = function() {
              setTimeout(() => window.print(), 500);
            };
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(barcodeHTML);
    printWindow.document.close();
    toast.success('Printing barcode...');
  };

  // Handle printing of QR code
  const handlePrintQRCode = () => {
    if (!qrCodeData.content) {
      toast.error('Please enter QR code content');
      return;
    }

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('Please allow pop-ups to print the QR code');
      return;
    }

    const qrHTML = `
      <html>
        <head>
          <title>Print QR Code</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              margin: 0;
              padding: 20px;
              text-align: center;
            }
            .qr-container {
              display: inline-block;
              margin: 10px;
              padding: 15px;
              border: 1px dashed #ccc;
            }
            .content {
              margin-top: 10px;
              font-size: 14px;
              word-break: break-all;
              max-width: ${qrCodeData.size}px;
            }
            @media print {
              body { margin: 0; padding: 0; }
              .qr-container { border: none; }
              @page { margin: 0.5cm; }
            }
          </style>
        </head>
        <body>
          <div class="qr-container">
            <div id="qrcode"></div>
            ${qrCodeData.includeLabel ? `<div class="content">${qrCodeData.content}</div>` : ''}
          </div>
          
          <script src="https://unpkg.com/qrcode-generator@1.4.4/qrcode.js"></script>
          <script>
            window.onload = function() {
              var typeNumber = 0;
              var errorCorrectionLevel = 'L';
              var qr = qrcode(typeNumber, errorCorrectionLevel);
              qr.addData('${qrCodeData.content}');
              qr.make();
              document.getElementById('qrcode').innerHTML = qr.createImgTag(${qrCodeData.size / 25}, 0);
              setTimeout(() => window.print(), 500);
            };
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(qrHTML);
    printWindow.document.close();
    toast.success('Printing QR code...');
  };

  // Delete a saved barcode from Firebase
  const handleDeleteBarcode = async (id: string) => {
    try {
      const barcodeDocRef = doc(db, 'barcodes', id);
      await deleteDoc(barcodeDocRef);
      toast.success('Barcode deleted successfully');
    } catch (error) {
      console.error('Error deleting barcode:', error);
      toast.error('Error deleting barcode');
    }
  };

  // Filter saved barcodes based on search term
  const filteredBarcodes = savedBarcodes.filter(barcode =>
    barcode.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (barcode.product && barcode.product.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Auto-generate barcodes for products that don't have them
  const generateBarcodesForProducts = async () => {
    try {
      const productsWithoutBarcodes = products.filter(product =>
        !savedBarcodes.some(barcode => barcode.productId === product.id)
      );

      if (productsWithoutBarcodes.length === 0) {
        toast.info('All products already have barcodes');
        return;
      }

      let generatedCount = 0;
      for (const product of productsWithoutBarcodes) {
        const barcodeContent = product.barcode || product.sku || product.id;

        const barcodeDoc = {
          content: barcodeContent,
          format: 'code128',
          product: product.name,
          price: product.sellingPrice.toString(),
          quantity: 1,
          includeLabel: true,
          includePrice: true,
          includeText: true,
          productId: product.id,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        };

        await addDoc(barcodesCollectionRef, barcodeDoc);
        generatedCount++;
      }

      toast.success(`Generated ${generatedCount} barcodes for products`);
    } catch (error) {
      console.error('Error generating barcodes:', error);
      toast.error('Error generating barcodes');
    }
  };

  // Render the barcodes when content or format changes
  useEffect(() => {
    renderBarcode();
  }, [barcodeData.content, barcodeData.format, barcodeData.includeText]);

  // Capture frames for scanning at regular intervals
  useEffect(() => {
    let intervalId: ReturnType<typeof setInterval>;

    if (isScanning) {
      intervalId = setInterval(captureFrame, 500);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [isScanning]);

  // Clean up camera when component unmounts
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  // Function to navigate to the scan tab
  const navigateToScanTab = () => {
    try {
      const tabsElement = document.querySelector('[role="tablist"]');
      if (tabsElement) {
        const scanTabButton = tabsElement.querySelector('[data-value="scan"]');
        if (scanTabButton && scanTabButton instanceof HTMLElement) {
          scanTabButton.click();
          return;
        }
      }

      setTimeout(() => {
        const scanTab = document.querySelector('[data-value="scan"]');
        if (scanTab && scanTab instanceof HTMLElement) {
          scanTab.click();
        }
      }, 10);
    } catch (error) {
      console.error('Error switching to scan tab:', error);
      toast.error('Could not switch to scan tab');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Barcode & QR Code Scanner/Generator</h1>
          <p className="text-muted-foreground">Scan, generate and print barcodes and QR codes for your products</p>
        </div>
        <Button onClick={generateBarcodesForProducts} variant="outline">
          <Plus className="h-4 w-4 mr-2" />
          Auto-generate for Products
        </Button>
      </div>

      <Tabs defaultValue="scan" className="w-full">
        <TabsList className="grid grid-cols-3 w-full max-w-md mb-6">
          <TabsTrigger value="scan" className="flex items-center gap-1">
            <Camera className="h-4 w-4" />
            <span>Scan Code</span>
          </TabsTrigger>
          <TabsTrigger value="barcode" className="flex items-center gap-1">
            <Scan className="h-4 w-4" />
            <span>Barcode</span>
          </TabsTrigger>
          <TabsTrigger value="qrcode" className="flex items-center gap-1">
            <QrCode className="h-4 w-4" />
            <span>QR Code</span>
          </TabsTrigger>
        </TabsList>

        {/* Scan Tab */}
        <TabsContent value="scan" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Camera className="h-5 w-5" />
                  Barcode & QR Code Scanner
                </CardTitle>
                <CardDescription>Scan codes using your device's camera</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col space-y-4">
                  {scanResult ? (
                    <>
                      <div className="p-4 border rounded-md bg-muted">
                        <div className="flex items-center gap-2 mb-2">
                          <Label className="font-medium">Scan Result:</Label>
                          <Badge variant="outline">
                            {scanResult.startsWith('http') || scanResult.includes('://') ? 'URL' :
                              scanResult.length === 13 && /^\d+$/.test(scanResult) ? 'EAN-13' :
                                scanResult.length === 8 && /^\d+$/.test(scanResult) ? 'EAN-8' : 'Text'}
                          </Badge>
                        </div>
                        <div className="font-mono text-sm break-all p-3 bg-background rounded border">
                          {scanResult}
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-3 mt-2">
                        <Button onClick={useScannedResult} className="flex-1">
                          <Plus className="h-4 w-4 mr-2" />
                          Use this code
                        </Button>
                        <Button variant="outline" onClick={() => {
                          navigator.clipboard.writeText(scanResult);
                          toast.success('Code copied to clipboard');
                        }} className="flex-1">
                          <Copy className="h-4 w-4 mr-2" />
                          Copy to clipboard
                        </Button>
                        <Button variant="outline" onClick={() => {
                          setScanResult('');
                          startCamera();
                        }} className="flex-1">
                          <Camera className="h-4 w-4 mr-2" />
                          Scan again
                        </Button>
                      </div>

                      <div className="text-sm text-muted-foreground mt-2 p-3 bg-muted/50 rounded-md border border-dashed flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 text-blue-500 flex-shrink-0" />
                        <p>Click "Use this code" to automatically populate the barcode or QR code generator with this value.</p>
                      </div>
                    </>
                  ) : (
                    <>
                      {availableCameras.length > 1 && (
                        <div className="space-y-2 mb-2">
                          <Label>Select Camera</Label>
                          <Select value={selectedCamera} onValueChange={handleCameraChange}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select camera" />
                            </SelectTrigger>
                            <SelectContent>
                              {availableCameras.map((camera: MediaDeviceInfo) => (
                                <SelectItem key={camera.deviceId} value={camera.deviceId}>
                                  {camera.label || `Camera ${availableCameras.indexOf(camera) + 1}`}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}

                      <div className="flex justify-center">
                        {isScanning ? (
                          <Button variant="destructive" size="lg" onClick={stopCamera} className="px-8">
                            <X className="h-4 w-4 mr-2" />
                            Stop Scanning
                          </Button>
                        ) : (
                          <Button size="lg" onClick={startCamera} className="px-8">
                            <Camera className="h-4 w-4 mr-2" />
                            Start Camera
                          </Button>
                        )}
                      </div>

                      <div className="text-sm text-muted-foreground mt-4 p-4 bg-muted/50 rounded-md border border-dashed">
                        <h4 className="font-medium mb-2">How to scan a code:</h4>
                        <ol className="list-decimal pl-5 space-y-1">
                          <li>Click "Start Camera" to activate your device's camera</li>
                          <li>Position the barcode or QR code within the scanner frame</li>
                          <li>Hold steady until the code is detected</li>
                          <li>Use the detected code in the barcode or QR code generator</li>
                        </ol>
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Camera Preview</CardTitle>
                <CardDescription>Point camera at a barcode or QR code</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center justify-center p-2 min-h-[350px] relative">
                {isScanning ? (
                  <>
                    <video ref={videoRef} autoPlay playsInline muted className="w-full h-full rounded-md video-preview" />
                    <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                      <div className="relative w-4/5 h-1/3 border-2 border-primary rounded-md">
                        <div className="absolute -top-2 -left-2 w-4 h-4 border-t-2 border-l-2 border-primary"></div>
                        <div className="absolute -top-2 -right-2 w-4 h-4 border-t-2 border-r-2 border-primary"></div>
                        <div className="absolute -bottom-2 -left-2 w-4 h-4 border-b-2 border-l-2 border-primary"></div>
                        <div className="absolute -bottom-2 -right-2 w-4 h-4 border-b-2 border-r-2 border-primary"></div>
                        <div className="absolute top-0 left-0 right-0 h-0.5 bg-primary/70 scan-animation"></div>
                      </div>
                    </div>

                    <div className="absolute bottom-3 left-0 right-0 flex justify-center">
                      <div className="px-3 py-1 bg-background/80 rounded-full border flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                        <span className="text-xs font-medium">Scanning...</span>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-muted-foreground flex flex-col items-center justify-center h-full">
                    <Camera className="h-16 w-16 mb-4 opacity-30" />
                    <p className="text-base">Camera preview will appear here</p>
                    <p className="text-sm mt-2">Click "Start Camera" to begin scanning</p>
                  </div>
                )}
                <canvas ref={canvasRef} className="hidden"></canvas>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Barcode Tab */}
        <TabsContent value="barcode" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            <Card className="lg:col-span-3">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Scan className="h-5 w-5" />
                  Barcode Generator
                </CardTitle>
                <CardDescription>Configure and generate a barcode</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="barcodeContent" className="font-medium">Barcode Content *</Label>
                    <Input
                      id="barcodeContent"
                      value={barcodeData.content}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setBarcodeData(prev => ({ ...prev, content: e.target.value }))}
                      placeholder="Enter barcode content"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="barcodeFormat" className="font-medium">Barcode Format</Label>
                    <Select value={barcodeData.format} onValueChange={(value: string) => setBarcodeData(prev => ({ ...prev, format: value }))}>
                      <SelectTrigger id="barcodeFormat">
                        <SelectValue placeholder="Select format" />
                      </SelectTrigger>
                      <SelectContent>
                        {barcodeFormats.map((format: { value: string; label: string; supports: string }) => (
                          <SelectItem key={format.value} value={format.value}>
                            {format.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground mt-1">
                      {barcodeFormats.find(f => f.value === barcodeData.format)?.supports}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="productName" className="font-medium">Product Name</Label>
                    <Input
                      id="productName"
                      value={barcodeData.product || ''}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setBarcodeData(prev => ({ ...prev, product: e.target.value }))}
                      placeholder="Enter product name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="productPrice" className="font-medium">Price (LKR)</Label>
                    <Input
                      id="productPrice"
                      type="text"
                      value={barcodeData.price || ''}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setBarcodeData(prev => ({ ...prev, price: e.target.value }))}
                      placeholder="Enter price"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="quantity" className="font-medium">Quantity</Label>
                    <Input
                      id="quantity"
                      type="number"
                      min="1"
                      max="100"
                      value={barcodeData.quantity}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setBarcodeData(prev => ({ ...prev, quantity: parseInt(e.target.value) || 1 }))}
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="includeLabel"
                      checked={barcodeData.includeLabel}
                      onCheckedChange={(checked: boolean | "indeterminate") =>
                        setBarcodeData(prev => ({ ...prev, includeLabel: !!checked }))
                      }
                    />
                    <Label htmlFor="includeLabel" className="cursor-pointer">Include Label</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="includePrice"
                      checked={barcodeData.includePrice}
                      onCheckedChange={(checked: boolean | "indeterminate") =>
                        setBarcodeData(prev => ({ ...prev, includePrice: !!checked }))
                      }
                    />
                    <Label htmlFor="includePrice" className="cursor-pointer">Include Price</Label>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="includeText"
                    checked={barcodeData.includeText}
                    onCheckedChange={(checked: boolean | "indeterminate") =>
                      setBarcodeData(prev => ({ ...prev, includeText: !!checked }))
                    }
                  />
                  <Label htmlFor="includeText" className="cursor-pointer">Show barcode text</Label>
                </div>

                <div className="flex flex-wrap gap-3 pt-2">
                  <Button onClick={handleSaveBarcode}>
                    <Plus className="h-4 w-4 mr-2" />
                    Save Barcode
                  </Button>
                  <Button variant="outline" onClick={() => handlePrintBarcode()}>
                    <Printer className="h-4 w-4 mr-2" />
                    Print
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      navigator.clipboard.writeText(barcodeData.content);
                      toast.success('Barcode content copied to clipboard');
                    }}
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Copy
                  </Button>
                  <Button variant="outline" onClick={navigateToScanTab}>
                    <Camera className="h-4 w-4 mr-2" />
                    Scan Instead
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Barcode Preview</CardTitle>
                <CardDescription>Preview of the generated barcode</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center justify-center p-6 min-h-[300px]">
                <div className="flex flex-col items-center border rounded p-4 w-full">
                  {barcodeData.includeLabel && barcodeData.product && (
                    <div className="font-medium text-center mb-2">{barcodeData.product}</div>
                  )}
                  <div className="my-2 w-full flex justify-center">
                    <svg ref={barcodeRef} className="max-w-full"></svg>
                  </div>
                  {barcodeData.includePrice && barcodeData.price && (
                    <div className="mt-2">LKR {barcodeData.price}</div>
                  )}
                </div>

                <Badge className="mt-4" variant="outline">
                  {barcodeFormats.find(f => f.value === barcodeData.format)?.label || barcodeData.format}
                </Badge>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* QR Code Tab */}
        <TabsContent value="qrcode" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            <Card className="lg:col-span-3">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <QrCode className="h-5 w-5" />
                  QR Code Generator
                </CardTitle>
                <CardDescription>Configure and generate a QR code</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="qrContent" className="font-medium">QR Code Content *</Label>
                  <Input
                    id="qrContent"
                    value={qrCodeData.content}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setQrCodeData(prev => ({ ...prev, content: e.target.value }))}
                    placeholder="Enter QR code content (text, URL, etc.)"
                  />
                </div>
                <br></br>
                <div className="space-y-2">
                  <Label htmlFor="qrSize" className="font-medium">QR Code Size</Label>
                  <div className="flex items-center space-x-4">
                    <Input
                      id="qrSize"
                      type="range"
                      min="100"
                      max="300"
                      step="10"
                      value={qrCodeData.size}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setQrCodeData(prev => ({ ...prev, size: parseInt(e.target.value) }))}
                      className="w-full"
                    />
                    <span className="w-12 text-right font-mono">{qrCodeData.size}px</span>
                  </div>
                </div>
                <br></br>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="qrIncludeLabel"
                    checked={qrCodeData.includeLabel}
                    onCheckedChange={(checked: boolean | "indeterminate") =>
                      setQrCodeData(prev => ({ ...prev, includeLabel: !!checked }))
                    }
                  />
                  <Label htmlFor="qrIncludeLabel" className="cursor-pointer">Show content below QR code</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="qrLogo"
                    checked={qrCodeData.logo}
                    onCheckedChange={(checked: boolean | "indeterminate") =>
                      setQrCodeData(prev => ({ ...prev, logo: !!checked }))
                    }
                  /><br></br><br></br>
                  <Label htmlFor="qrLogo" className="cursor-pointer">Include logo (reduces scanability)</Label>
                </div>

                <div className="flex flex-wrap gap-3 pt-2">
                  <Button
                    onClick={() => {
                      if (!qrCodeData.content) {
                        toast.error('Please enter QR code content');
                        return;
                      }
                      toast.success('QR Code generated');
                    }}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Generate QR Code
                  </Button>
                  <Button variant="outline" onClick={handlePrintQRCode}>
                    <Printer className="h-4 w-4 mr-2" />
                    Print
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      if (!qrCodeData.content) {
                        toast.error('Please enter QR code content');
                        return;
                      }
                      navigator.clipboard.writeText(qrCodeData.content);
                      toast.success('QR code content copied to clipboard');
                    }}
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Copy
                  </Button>
                  <Button variant="outline" onClick={navigateToScanTab}>
                    <Camera className="h-4 w-4 mr-2" />
                    Scan Instead
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>QR Code Preview</CardTitle>
                <CardDescription>Preview of the generated QR code</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center justify-center p-6 min-h-[300px]">
                <div className="flex flex-col items-center border rounded p-4" ref={qrCodeRef}>
                  {qrCodeData.content ? (
                    <>
                      <QRCodeSVG
                        value={qrCodeData.content}
                        size={qrCodeData.size}
                        level="M"
                        includeMargin={true}
                      />
                      {qrCodeData.includeLabel && (
                        <div className="mt-3 text-center break-all max-w-full">
                          {qrCodeData.content}
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-muted-foreground flex flex-col items-center">
                      <QrCode className="h-16 w-16 mb-2 opacity-30" />
                      <p>QR code preview will appear here</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Saved Barcodes List */}
      <Card className="mt-8">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Scan className="h-5 w-5" />
            Saved Barcodes & QR Codes
          </CardTitle>
          <CardDescription>View and manage your saved codes</CardDescription>

          <div className="relative mt-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by content or product name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-2">Loading barcodes...</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[80px]">ID</TableHead>
                  <TableHead className="w-[100px]">Barcode</TableHead>
                  <TableHead>Content</TableHead>
                  <TableHead className="w-[100px]">Format</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead className="w-[100px]">Price</TableHead>
                  <TableHead className="w-[120px] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBarcodes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-6 text-muted-foreground">
                      {searchTerm ? 'No barcodes match your search' : 'No barcodes saved yet. Create one using the generators above.'}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredBarcodes.map(barcode => (
                    <TableRow key={barcode.id}>
                      <TableCell className="font-mono text-xs">{barcode.id}</TableCell>
                      <TableCell>
                        <div className="w-24 h-8">
                          <svg className="barcode-mini" id={`mini-${barcode.id}`}>
                            {(() => {
                              setTimeout(() => {
                                try {
                                  const element = document.getElementById(`mini-${barcode.id}`);
                                  if (element) {
                                    JsBarcode(element, barcode.content, {
                                      format: barcode.format,
                                      width: 1,
                                      height: 30,
                                      displayValue: false,
                                      margin: 0
                                    });
                                  }
                                } catch (error) {
                                  console.error('Error rendering mini barcode:', error);
                                }
                              }, 0);
                              return null;
                            })()}
                          </svg>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-xs max-w-[150px] truncate" title={barcode.content}>
                        {barcode.content}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {barcodeFormats.find(f => f.value === barcode.format)?.label || barcode.format}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-[150px] truncate" title={barcode.product || ''}>
                        {barcode.product || '-'}
                      </TableCell>
                      <TableCell>{barcode.price ? `LKR ${barcode.price}` : '-'}</TableCell>
                      <TableCell>
                        <div className="flex justify-end space-x-2">
                          <Button size="sm" variant="outline" onClick={() => handlePrintBarcode(barcode)} title="Print">
                            <Printer className="h-3.5 w-3.5" />
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => handleDeleteBarcode(barcode.id)} title="Delete">
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}