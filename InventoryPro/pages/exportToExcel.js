// exportToExcel.js
export function tableToExcel(table, name) {
    const uri = 'data:application/vnd.ms-excel;base64,';
    const template = `<html xmlns:o="urn:schemas-microsoft-com:office:office" 
        xmlns:x="urn:schemas-microsoft-com:office:excel" 
        xmlns="http://www.w3.org/TR/REC-html40">
        <head><!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet>
            <x:Name>${name}</x:Name>
            <x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions>
        </x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]-->
        </head><body>${table.outerHTML}</body></html>`;
    
    const link = document.createElement('a');
    link.download = `${name}_${new Date().toISOString().slice(0,10)}.xls`;
    link.href = uri + window.btoa(unescape(encodeURIComponent(template)));
    link.click();
}