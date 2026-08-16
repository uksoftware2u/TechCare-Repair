from PIL import Image, ImageDraw, ImageFont

source = Image.open(r"C:\Users\Repair\AppData\Local\Temp\codex-clipboard-c1f29642-9dd6-4d72-bae7-98dd4364aa4f.png").convert("RGB")
implementation = Image.open(r"C:\Repair\repair-system\repair-success-print-actions.png").convert("RGB")
source.thumbnail((650, 430))
implementation.thumbnail((650, 430))
gap, header = 18, 48
canvas = Image.new("RGB", (source.width + implementation.width + gap * 3, max(source.height, implementation.height) + header + 18), "#eef3f0")
draw = ImageDraw.Draw(canvas)
font = ImageFont.load_default()
draw.text((gap, 17), "SOURCE SUCCESS STEP", fill="#173f31", font=font)
right = source.width + gap * 2
draw.text((right, 17), "IMPLEMENTATION WITH RECEIPT ACTIONS", fill="#087441", font=font)
canvas.paste(source, (gap, header))
canvas.paste(implementation, (right, header))
canvas.save(r"C:\Repair\repair-system\repair-receipt-success-comparison.png")
