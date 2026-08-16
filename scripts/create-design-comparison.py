from PIL import Image, ImageDraw, ImageFont

source = Image.open(r"C:\Users\Repair\AppData\Local\Temp\codex-clipboard-a52deb54-c5d3-477f-bcb9-df23683d8874.png").convert("RGB")
implementation = Image.open(r"C:\Repair\repair-system\new-customer-modern.png").convert("RGB")

height = 720
header = 54
gap = 18
source.thumbnail((620, height - header - 18))
implementation.thumbnail((720, height - header - 18))
width = source.width + implementation.width + gap * 3
canvas = Image.new("RGB", (width, height), "#eef3f0")
draw = ImageDraw.Draw(canvas)
font = ImageFont.load_default()
draw.text((gap, 18), "SOURCE / REMOVAL NOTES", fill="#173f31", font=font)
right_x = gap * 2 + source.width
draw.text((right_x, 18), "IMPLEMENTATION / TECHCARE UI", fill="#087441", font=font)
canvas.paste(source, (gap, header))
canvas.paste(implementation, (right_x, header))
canvas.save(r"C:\Repair\repair-system\new-customer-design-comparison.png")
