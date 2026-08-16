from PIL import Image, ImageDraw, ImageFont

source = Image.open(r"C:\Users\Repair\AppData\Local\Temp\codex-clipboard-83943cb3-5181-4977-99d1-b21527b6c689.png").convert("RGB")
implementation = Image.open(r"C:\Repair\repair-system\receipt-company-profile-data.png").convert("RGB")
source.thumbnail((620, 455))
implementation.thumbnail((650, 455))
gap, header = 18, 48
canvas = Image.new("RGB", (source.width + implementation.width + gap * 3, max(source.height, implementation.height) + header + 18), "#eef3f0")
draw = ImageDraw.Draw(canvas)
font = ImageFont.load_default()
draw.text((gap, 17), "SOURCE RECEIPT", fill="#173f31", font=font)
right = source.width + gap * 2
draw.text((right, 17), "COMPANY PROFILE INTEGRATION", fill="#087441", font=font)
canvas.paste(source, (gap, header))
canvas.paste(implementation, (right, header))
canvas.save(r"C:\Repair\repair-system\company-receipt-comparison.png")
