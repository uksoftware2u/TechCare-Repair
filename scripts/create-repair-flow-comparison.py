from PIL import Image, ImageDraw, ImageFont

source = Image.open(r"C:\Users\Repair\AppData\Local\Temp\codex-clipboard-bb7f4ef0-077f-4e67-92fd-9d5f4ce39135.png").convert("RGB")
implementation = Image.open(r"C:\Repair\repair-system\repair-intake-device-stage.png").convert("RGB")
target_width = 660
source.thumbnail((target_width, 410))
implementation.thumbnail((target_width, 410))
header = 48
gap = 18
canvas = Image.new("RGB", (target_width * 2 + gap * 3, max(source.height, implementation.height) + header + 18), "#eef3f0")
draw = ImageDraw.Draw(canvas)
font = ImageFont.load_default()
draw.text((gap, 17), "SOURCE / DEVICE & CONDITION", fill="#173f31", font=font)
draw.text((gap * 2 + target_width, 17), "IMPLEMENTATION / WORKING STAGE", fill="#087441", font=font)
canvas.paste(source, (gap, header))
canvas.paste(implementation, (gap * 2 + target_width, header))
canvas.save(r"C:\Repair\repair-system\repair-intake-flow-comparison.png")
