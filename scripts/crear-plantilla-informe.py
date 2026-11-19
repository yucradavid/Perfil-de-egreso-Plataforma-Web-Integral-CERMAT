"""crear-plantilla-informe.py — Plantilla de Word de los informes del perfil (CE02 y CE03)

Parte de la plantilla por defecto de pandoc y la deja en A4 (márgenes de 2,5 y 2 cm), con
Calibri de 10,5 pt en español, títulos en azul oscuro, tablas con bordes y texto de 9 pt,
encabezado de tabla sombreado que se repite en cada página, filas que no se cortan entre
páginas y pie con el título del informe y el número de página. La usa scripts/generar-informes.mjs.

Uso (desde perfil-egreso/):  python scripts/crear-plantilla-informe.py scripts/plantilla-informe.docx
Requiere pandoc en el PATH.
"""
import io, re, subprocess, sys, zipfile

dst = sys.argv[1] if len(sys.argv) > 1 else 'scripts/plantilla-informe.docx'
base = subprocess.run(['pandoc', '--print-default-data-file', 'reference.docx'], capture_output=True, check=True).stdout
with zipfile.ZipFile(io.BytesIO(base)) as z:
    files = {n: z.read(n) for n in z.namelist()}

def sub1(pat, rep, s, flags=re.S):
    s2, n = re.subn(pat, rep, s, count=1, flags=flags)
    assert n == 1, pat
    return s2

# Fuentes del tema: Calibri en títulos y texto
t = files['word/theme/theme1.xml'].decode('utf8')
t = sub1(r'(<a:majorFont>\s*<a:latin typeface=")[^"]*', r'\1Calibri', t)
t = sub1(r'(<a:minorFont>\s*<a:latin typeface=")[^"]*', r'\1Calibri', t)
files['word/theme/theme1.xml'] = t.encode('utf8')

s = files['word/styles.xml'].decode('utf8')
# Texto base: 10,5 pt, español de Perú
s = sub1(r'<w:sz w:val="24" />\s*<w:szCs w:val="24" />\s*<w:lang w:val="en-US"', '<w:sz w:val="21" /><w:szCs w:val="21" /><w:lang w:val="es-PE"', s)
s = sub1(r'(<w:style w:type="paragraph" w:styleId="BodyText">.*?)<w:spacing w:before="180" w:after="180" />', r'\1<w:spacing w:before="120" w:after="60" w:line="264" w:lineRule="auto" />', s)
s = sub1(r'(<w:style w:type="paragraph" w:customStyle="1" w:styleId="Compact">.*?)<w:spacing w:before="36" w:after="36" />', r'\1<w:spacing w:before="20" w:after="20" w:line="240" w:lineRule="auto" />', s)
# Títulos en azul oscuro
s = re.sub(r'<w:color w:val="0F4761" w:themeColor="accent1"\s*w:themeShade="BF" />', '<w:color w:val="1F3864" />', s)
for sid, sz in [('Heading1', 30), ('Heading2', 26), ('Heading3', 23)]:
    s = sub1(r'(<w:style w:type="paragraph" w:styleId="%s">.*?<w:sz w:val=")\d+(" />\s*<w:szCs w:val=")\d+' % sid, r'\g<1>%d\g<2>%d' % (sz, sz), s)
# Tablas con bordes, texto de 9 pt y encabezado sombreado que se repite en cada página
borde = '<w:{0} w:val="single" w:sz="4" w:space="0" w:color="A6A6A6" />'
bordes = ''.join(borde.format(b) for b in ['top', 'left', 'bottom', 'right', 'insideH', 'insideV'])
s = sub1(r'(<w:style w:type="table" w:default="1" w:styleId="Table">.*?<w:tblInd w:w="0" w:type="dxa" />)',
         r'\1<w:tblBorders>%s</w:tblBorders>' % bordes, s)
s = sub1(r'(<w:style w:type="table" w:default="1" w:styleId="Table">.*?<w:top w:w=")0(" w:type="dxa" />.*?<w:bottom w:w=")0', r'\g<1>30\g<2>30', s)
s = sub1(r'(<w:style w:type="table" w:default="1" w:styleId="Table">.*?<w:left w:w=")108(" w:type="dxa" />.*?<w:right w:w=")108', r'\g<1>85\g<2>85', s)
# En w:style, rPr va antes de tblPr
s = sub1(r'(<w:style w:type="table" w:default="1" w:styleId="Table">.*?)(<w:tblPr>)',
         r'\1<w:rPr><w:sz w:val="18" /><w:szCs w:val="18" /></w:rPr>\2', s)
# Filas que no se cortan entre páginas (trPr va después de tblPr)
s = sub1(r'(<w:style w:type="table" w:default="1" w:styleId="Table">.*?</w:tblPr>)', r'\1<w:trPr><w:cantSplit /></w:trPr>', s)
s = sub1(r'<w:tblStylePr w:type="firstRow">\s*<w:tcPr>\s*<w:tcBorders>\s*<w:bottom w:val="single"/>\s*</w:tcBorders>\s*<w:vAlign w:val="bottom"/>\s*</w:tcPr>\s*</w:tblStylePr>',
         '<w:tblStylePr w:type="firstRow"><w:rPr><w:b /><w:bCs /></w:rPr><w:trPr><w:tblHeader /></w:trPr><w:tcPr><w:shd w:val="clear" w:color="auto" w:fill="DCE3F0" /><w:vAlign w:val="bottom" /></w:tcPr></w:tblStylePr>', s)
s = sub1(r'(<w:style w:type="character" w:customStyle="1" w:styleId="VerbatimChar">.*?)<w:sz w:val="22" />', r'\1<w:sz w:val="18" />', s)
s = sub1(r'(<w:style w:type="character" w:styleId="Hyperlink">.*?)<w:color w:val="4F81BD" w:themeColor="accent1" />', r'\1<w:color w:val="1F4E79" />', s)
# Estilo de carácter que el generador aplica al título de la portada; el pie lo cita con
# STYLEREF. Es propio porque los nombres de los estilos integrados ("Title") cambian con el
# idioma de Word y el campo fallaría en un Word en español.
s = sub1(r'</w:styles>', '<w:style w:type="character" w:customStyle="1" w:styleId="Titulodelinforme"><w:name w:val="Titulo del informe" />'
         '<w:basedOn w:val="DefaultParagraphFont" /><w:uiPriority w:val="99" /></w:style></w:styles>', s)
files['word/styles.xml'] = s.encode('utf8')

# Pie de página: "CERMAT · <título del informe> · página N de M". El título se toma del texto
# con el estilo "Titulo del informe" (STYLEREF, que Word recalcula al paginar; un campo TITLE se
# quedaría con el texto de reserva), así una sola plantilla sirve para las dos líneas.
rpr = '<w:rPr><w:color w:val="7F7F7F" /><w:sz w:val="16" /></w:rPr>'
texto = lambda t: '<w:r>%s<w:t xml:space="preserve">%s</w:t></w:r>' % (rpr, t)
marca = lambda tipo: '<w:r>%s<w:fldChar w:fldCharType="%s" /></w:r>' % (rpr, tipo)
campo = lambda instr, previo: (marca('begin') + '<w:r>%s<w:instrText xml:space="preserve"> %s </w:instrText></w:r>' % (rpr, instr)
                               + marca('separate') + texto(previo) + marca('end'))
pie = ('<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
 '<w:ftr xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">'
 '<w:p><w:pPr><w:jc w:val="center" /></w:pPr>'
 + texto('CERMAT · ') + campo('STYLEREF "Titulo del informe"', 'Perfil de egreso EPE') + texto(' · página ')
 + campo('PAGE', '1') + texto(' de ') + campo('NUMPAGES', '1') +
 '</w:p></w:ftr>')
files['word/footer1.xml'] = pie.encode('utf8')
r = files['word/_rels/document.xml.rels'].decode('utf8')
r = r.replace('</Relationships>', '<Relationship Id="rIdPie1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/footer" Target="footer1.xml"/></Relationships>')
files['word/_rels/document.xml.rels'] = r.encode('utf8')
c = files['[Content_Types].xml'].decode('utf8')
c = c.replace('</Types>', '<Override PartName="/word/footer1.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.footer+xml"/></Types>')
files['[Content_Types].xml'] = c.encode('utf8')
# A4 con márgenes de 2,5 cm arriba y abajo y 2 cm a los lados
d = files['word/document.xml'].decode('utf8')
sect = ('<w:sectPr><w:footerReference w:type="default" r:id="rIdPie1" />'
        '<w:pgSz w:w="11906" w:h="16838" />'
        '<w:pgMar w:top="1418" w:right="1134" w:bottom="1418" w:left="1134" w:header="709" w:footer="567" w:gutter="0" /></w:sectPr>')
# Orden del esquema: referencias de pie, luego footnotePr, luego tamaño y márgenes
sect = sect.replace('r:id="rIdPie1" />', 'r:id="rIdPie1" /><w:footnotePr><w:numRestart w:val="eachSect" /></w:footnotePr>', 1)
d = sub1(r'<w:sectPr>.*?</w:sectPr>', sect, d)
if 'xmlns:r=' not in d[:2000]:
    d = d.replace('<w:document ', '<w:document xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" ', 1)
files['word/document.xml'] = d.encode('utf8')

with zipfile.ZipFile(dst, 'w', zipfile.ZIP_DEFLATED) as out:
    order = ['[Content_Types].xml'] + [n for n in files if n != '[Content_Types].xml']
    for n in order:
        out.writestr(n, files[n])
print('plantilla:', dst)
