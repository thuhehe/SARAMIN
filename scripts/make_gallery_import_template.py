#!/usr/bin/env python3
"""Build the image-set import template customers fill in.

ONE ROW PER IMAGE, not per set: rows sharing a `Name` are grouped into one set on
import. A customer thinks "here is the ngang photo of Văn phòng HN", never "here
is a set" — asking them to model the grouping is where a hand-filled sheet goes
wrong, so the sheet does the grouping for them.

The Industry list is READ OUT OF src/pages/admin/data/industries.ts rather than
retyped here, so the dropdown cannot drift from the master tree. Levels are told
apart by indentation (2 / 4 / 6 spaces), which is how that file is written.

    python3 scripts/make_gallery_import_template.py
"""
import re
import sys
from pathlib import Path

from openpyxl import Workbook
from openpyxl.styles import Alignment, Border, Font, PatternFill, Side
from openpyxl.utils import get_column_letter
from openpyxl.worksheet.datavalidation import DataValidation

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "public" / "templates" / "gallery-image-sets-import-template.xlsx"

BRAND = "1F5FBF"
HEAD_BG = PatternFill("solid", fgColor=BRAND)
HEAD_FONT = Font(color="FFFFFF", bold=True, size=11)
REQ_FONT = Font(color="FFD9D9", bold=True, size=11)
THIN = Side(style="thin", color="D4D9E2")
BOX = Border(left=THIN, right=THIN, top=THIN, bottom=THIN)
NOTE_BG = PatternFill("solid", fgColor="EEF4FF")
EX_BG = PatternFill("solid", fgColor="F7F9FC")
EX_FONT = Font(italic=True, color="7A8699", size=10)


def read_industries() -> list[tuple[int, str]]:
    """(level, full path) for every node in the master tree, in tree order."""
    src = (ROOT / "src" / "pages" / "admin" / "data" / "industries.ts").read_text(encoding="utf-8")
    body = src.split("export const INDUSTRY_TREE", 1)[1]
    body = body.split("export type IndustryInfo", 1)[0]
    out: list[tuple[int, str]] = []
    stack: list[str] = []
    for line in body.splitlines():
        m = re.match(r"^(\s*)\{ id: '[^']+', name: '([^']+)'", line)
        if not m:
            continue
        level = len(m.group(1)) // 2          # 2 spaces per level in that file
        name = m.group(2)
        if level < 1 or level > 3:
            continue
        stack = stack[: level - 1] + [name]
        out.append((level, " › ".join(stack)))
    if not out:
        sys.exit("could not read INDUSTRY_TREE — has industries.ts been reformatted?")
    return out


def read_topics() -> list[str]:
    src = (ROOT / "src" / "pages" / "admin" / "data" / "products.ts").read_text(encoding="utf-8")
    block = src.split("export const GALLERY_TOPICS = [", 1)[1].split("]", 1)[0]
    return re.findall(r"'([^']+)'", block)


FORMATS = [
    ("Ngang", "596 × 336 px · tỉ lệ 16:9", "Thẻ lúc nghỉ trên các dải trả phí"),
    ("Dọc", "600 × 800 px · tỉ lệ 3:4", "Thẻ mở rộng khi rê chuột (hover)"),
    ("Tròn", "240 × 240 px · tỉ lệ 1:1", "Dải thẻ ảnh tròn"),
]

COLS = [
    ("Name", 26, True,
     "Tên cụm ảnh. Các dòng CÙNG TÊN được gộp thành MỘT cụm — đó là cách bạn nói ba tấm ảnh này là cùng một cảnh."),
    ("Image link", 46, True,
     "Link mở được tới file ảnh (Google Drive, Dropbox…). Nhớ đặt quyền 'Anyone with the link'."),
    ("Format", 12, True,
     "Ngang · Dọc · Tròn. Mỗi tên cụm chỉ được có MỘT dòng cho mỗi format."),
    ("Industry", 46, True,
     "Chọn từ danh sách — được chọn ở cấp 1 (nhóm), cấp 2 (ngành) hoặc cấp 3 (chuyên ngành). Nhiều ngành thì phân cách bằng dấu ;"),
    ("Topics tag", 30, False,
     "Chủ đề ảnh, phân cách bằng dấu phẩy. Xem danh sách hợp lệ ở sheet 'Danh mục'."),
    ("Licence expiry", 16, False,
     "dd/mm/yyyy. Để trống nếu bản quyền vĩnh viễn."),
]

EXAMPLES = [
    ["Văn phòng HN", "https://drive.google.com/file/d/FILE_ID/view?usp=sharing", "Ngang",
     "IT / Software › Software & IT services", "Văn phòng, Nhóm người", "31/12/2027"],
    ["Văn phòng HN", "https://drive.google.com/file/d/FILE_ID/view?usp=sharing", "Dọc",
     "IT / Software › Software & IT services", "Văn phòng, Nhóm người", "31/12/2027"],
    ["Văn phòng HN", "https://drive.google.com/file/d/FILE_ID/view?usp=sharing", "Tròn",
     "IT / Software › Software & IT services", "Văn phòng, Nhóm người", "31/12/2027"],
    ["Kho Bình Dương", "https://drive.google.com/file/d/FILE_ID/view?usp=sharing", "Ngang",
     "Logistics › Warehousing & fulfilment", "Kho vận", ""],
    ["Kho Bình Dương", "https://drive.google.com/file/d/FILE_ID/view?usp=sharing", "Dọc",
     "Logistics › Warehousing & fulfilment", "Kho vận", ""],
]


def build() -> None:
    industries = read_industries()
    topics = read_topics()
    wb = Workbook()

    # ── Sheet 1 · the sheet they fill in ──────────────────────────────────────
    ws = wb.active
    ws.title = "Images"
    ws.sheet_properties.tabColor = BRAND

    ws["A1"] = ("Mỗi DÒNG là MỘT tấm ảnh. Các dòng cùng «Name» được gộp thành một cụm ảnh "
                "(tối đa 3 dòng: Ngang · Dọc · Tròn). Ba dòng tô xám bên dưới là ví dụ — xoá đi trước khi gửi lại.")
    ws["A1"].font = Font(bold=True, size=10, color="24405E")
    ws["A1"].alignment = Alignment(vertical="center", wrap_text=True)
    ws["A1"].fill = NOTE_BG
    ws.merge_cells(start_row=1, start_column=1, end_row=1, end_column=len(COLS))
    ws.row_dimensions[1].height = 30

    for i, (name, width, req, hint) in enumerate(COLS, start=1):
        letter = get_column_letter(i)
        c = ws.cell(row=2, column=i, value=name + (" *" if req else ""))
        c.fill, c.font = HEAD_BG, (REQ_FONT if req else HEAD_FONT)
        c.alignment = Alignment(horizontal="center", vertical="center")
        c.border = BOX
        h = ws.cell(row=3, column=i, value=hint)
        h.font = Font(size=8.5, color="7A8699")
        h.alignment = Alignment(vertical="top", wrap_text=True)
        h.border = BOX
        ws.column_dimensions[letter].width = width
    ws.row_dimensions[2].height = 20
    ws.row_dimensions[3].height = 56

    for r, row in enumerate(EXAMPLES, start=4):
        for ci, val in enumerate(row, start=1):
            c = ws.cell(row=r, column=ci, value=val)
            c.fill, c.font, c.border = EX_BG, EX_FONT, BOX
            c.alignment = Alignment(vertical="center")

    last = 400
    for r in range(len(EXAMPLES) + 4, last + 1):
        for ci in range(1, len(COLS) + 1):
            ws.cell(row=r, column=ci).border = BOX

    # ── Sheet 3 is the validation source, so build it before wiring dropdowns ──
    lists = wb.create_sheet("Danh mục")
    lists["A1"] = "Format hợp lệ"
    lists["C1"] = "Industry hợp lệ (cấp 1 · 2 · 3)"
    lists["F1"] = "Topics tag hợp lệ"
    for cell in ("A1", "C1", "F1"):
        lists[cell].font = Font(bold=True, color="FFFFFF")
        lists[cell].fill = HEAD_BG
    lists["A2"], lists["B2"] = "Giá trị", "Kích thước · dùng ở đâu"
    lists["C2"], lists["D2"] = "Cấp", "Giá trị — dán nguyên chuỗi này vào cột Industry"
    lists["F2"] = "Giá trị"
    for cell in ("A2", "B2", "C2", "D2", "F2"):
        lists[cell].font = Font(bold=True, size=9, color="5A6475")

    for i, (f, size, where) in enumerate(FORMATS, start=3):
        lists.cell(row=i, column=1, value=f)
        lists.cell(row=i, column=2, value=f"{size} — {where}").font = Font(size=9, color="7A8699")
    for i, (level, path) in enumerate(industries, start=3):
        lists.cell(row=i, column=3, value=f"Cấp {level}").font = Font(size=9, color="7A8699")
        lists.cell(row=i, column=4, value=path)
    for i, t in enumerate(topics, start=3):
        lists.cell(row=i, column=6, value=t)

    lists.column_dimensions["A"].width = 14
    lists.column_dimensions["B"].width = 46
    lists.column_dimensions["C"].width = 9
    lists.column_dimensions["D"].width = 60
    lists.column_dimensions["F"].width = 28
    lists.freeze_panes = "A3"

    fmt_ref = f"'Danh mục'!$A$3:$A${2 + len(FORMATS)}"
    ind_ref = f"'Danh mục'!$D$3:$D${2 + len(industries)}"

    dv_fmt = DataValidation(type="list", formula1=fmt_ref, allow_blank=False, showDropDown=False)
    dv_fmt.error = "Format phải là Ngang, Dọc hoặc Tròn."
    dv_fmt.errorTitle = "Format không hợp lệ"
    ws.add_data_validation(dv_fmt)
    dv_fmt.add(f"C4:C{last}")

    # Industry is a WARNING, not a hard stop: several industries go in one cell
    # separated by ";", which a list validation cannot express. Blocking it would
    # force the customer to pick one and lose the rest.
    dv_ind = DataValidation(type="list", formula1=ind_ref, allow_blank=True, showDropDown=False, errorStyle="warning")
    dv_ind.error = ("Chọn từ danh sách, hoặc ghép nhiều ngành bằng dấu ; "
                    "(ví dụ: Logistics › Warehousing & fulfilment; Retail)")
    dv_ind.errorTitle = "Kiểm tra lại tên ngành"
    ws.add_data_validation(dv_ind)
    dv_ind.add(f"D4:D{last}")

    ws.freeze_panes = "A4"
    ws.auto_filter.ref = f"A2:{get_column_letter(len(COLS))}2"

    # ── Sheet 2 · how to fill it in ───────────────────────────────────────────
    g = wb.create_sheet("Hướng dẫn", 1)
    g.column_dimensions["A"].width = 4
    g.column_dimensions["B"].width = 104
    rows = [
        ("h", "Chuẩn bị ảnh cho Saramin — hướng dẫn điền"),
        ("p", "Mỗi tin đăng ở gói trả phí in CÙNG MỘT tấm ảnh theo ba khung khác nhau: ngang khi thẻ đứng yên, "
              "dọc khi rê chuột vào thẻ, và tròn ở dải thẻ ảnh tròn. Ba khung đó gộp lại gọi là MỘT CỤM ẢNH."),
        ("h2", "1 · Một dòng là một tấm ảnh"),
        ("p", "Không điền một dòng cho cả cụm. Ảnh ngang một dòng, ảnh dọc một dòng, ảnh tròn một dòng — "
              "cả ba dùng CHUNG một giá trị ở cột «Name», và hệ thống tự gộp lại thành một cụm."),
        ("p", "Thiếu một khung vẫn nhập được. Cụm thiếu khung vẫn dùng được cho đúng khung nó có, "
              "nhưng sẽ KHÔNG được hệ thống tự động chọn cho tin đăng."),
        ("h2", "2 · Ảnh nên chuẩn bị thế nào"),
        ("p", "• Ngang: 596 × 336 px (16:9)   • Dọc: 600 × 800 px (3:4)   • Tròn: 240 × 240 px (1:1)"),
        ("p", "• Nếu chỉ có một ảnh gốc lớn (≥ 1600 × 1200), cứ gửi ảnh đó ở cả ba dòng — đội Saramin sẽ cắt lại."),
        ("p", "• Thẻ sẽ tự vẽ logo, tên công ty và nhãn ĐÈ LÊN ảnh ở góc dưới-trái và góc trên-phải. "
              "Đừng để mặt người hay chữ quan trọng nằm ở hai vùng đó."),
        ("p", "• Ảnh KHÔNG được có sẵn chữ, logo hay khung viền — thẻ tự vẽ những thứ đó."),
        ("h2", "3 · Link ảnh"),
        ("p", "Tải ảnh lên Google Drive (hoặc Dropbox) rồi dán link vào cột «Image link». "
              "Đặt quyền «Anyone with the link can view», nếu không hệ thống sẽ không tải được ảnh về."),
        ("h2", "4 · Ngành"),
        ("p", "Chọn từ dropdown ở cột «Industry». Danh sách có 3 cấp và BẠN CHỌN Ở CẤP NÀO CŨNG ĐƯỢC:"),
        ("p", "    – Cấp 1 «Logistics» → ảnh dùng được cho MỌI tin thuộc nhóm Logistics."),
        ("p", "    – Cấp 3 «Logistics › Freight & transport › Road freight» → chỉ ưu tiên cho đúng chuyên ngành đó."),
        ("p", "Chọn càng cụ thể thì ảnh càng được ưu tiên cho đúng tin. Nhiều ngành thì ghép bằng dấu chấm phẩy (;)."),
        ("h2", "5 · Chủ đề (Topics tag)"),
        ("p", "Mô tả ảnh CHO THẤY GÌ — «Văn phòng», «Kho vận», «Nhóm người». Phân cách bằng dấu phẩy. "
              "Danh sách hợp lệ ở sheet «Danh mục». Cột này không bắt buộc nhưng giúp tìm ảnh nhanh hơn rất nhiều."),
        ("h2", "6 · Bản quyền"),
        ("p", "«Licence expiry» là ngày hết hạn bản quyền ảnh (dd/mm/yyyy). Để trống nếu ảnh thuộc sở hữu vĩnh viễn "
              "hoặc do chính công ty bạn chụp. Ảnh hết hạn sẽ được gỡ khỏi thư viện."),
        ("h2", "Gửi lại"),
        ("p", "Điền xong, xoá các dòng ví dụ màu xám rồi gửi lại file .xlsx này cho người phụ trách ở Saramin."),
    ]
    r = 2
    for kind, text in rows:
        c = g.cell(row=r, column=2, value=text)
        if kind == "h":
            c.font = Font(bold=True, size=15, color="24405E")
            r += 1
        elif kind == "h2":
            c.font = Font(bold=True, size=11.5, color=BRAND)
            r += 1
        else:
            c.font = Font(size=10.5, color="3C4759")
            c.alignment = Alignment(wrap_text=True, vertical="top")
            g.row_dimensions[r].height = 15 * (1 + len(text) // 100)
            r += 1
        r += 0
    g.sheet_view.showGridLines = False

    OUT.parent.mkdir(parents=True, exist_ok=True)
    wb.save(OUT)
    print(f"wrote {OUT}  ({len(industries)} industries, {len(topics)} topics)")


if __name__ == "__main__":
    build()
