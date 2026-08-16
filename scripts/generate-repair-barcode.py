from reportlab.graphics.barcode import createBarcodeDrawing
from reportlab.graphics import renderSVG

value = "SR-20260812-005"
drawing = createBarcodeDrawing("Code128", value=value, barHeight=42, barWidth=1.05, humanReadable=False)
renderSVG.drawToFile(drawing, r"C:\Repair\repair-system\public\assets\barcode-sr-20260812-005.svg")
