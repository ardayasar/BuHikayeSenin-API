#!/bin/bash
wkhtmltopdf --enable-local-file-access --page-width 80mm --page-height 5000mm --margin-left 4mm --margin-right 4mm --dpi 300 "$1".html "$1"-t.pdf

fname=""$1"-t.pdf"
pagesize=( $(pdfinfo "$fname" | grep "Page size" | cut -d ":" -f2 | \
    awk '{ print $1,$3 }') )
bounding=( $(pdfcrop --verbose "$fname" | grep "%%HiResBoundingBox" | \
    cut -d":" -f2 ) )
rm "${fname//.pdf/-crop.pdf}"
lmarg="${bounding[0]}"
rmarg="$(python3 -c "print('{:.3f}'.format(${pagesize[0]} - ${bounding[2]}))")"
pdfcrop --margins "$lmarg 25 $rmarg 50" "$fname" ""$1".pdf"

rm "$fname"


# #!/bin/bash
# # 1. convert html to one long paged pdf (5000mm long):
# wkhtmltopdf --enable-local-file-access --page-width 72mm --page-height 5000mm "$1".html "$1"-t.pdf

# # 2. crop the long pdf:
# fname=""$1"-t.pdf"
# pagesize=( $(pdfinfo "$fname" | grep "Page size" | cut -d ":" -f2 | \
#     awk '{ print $1,$3 }') )
# bounding=( $(pdfcrop --verbose "$fname" | grep "%%HiResBoundingBox" | \
#     cut -d":" -f2 ) )
# rm "${fname//.pdf/-crop.pdf}"
# lmarg="${bounding[0]}"
# rmarg="$(python3 -c "print('{:.3f}'.format(${pagesize[0]} - ${bounding[2]}))")"
# pdfcrop --margins "$lmarg 0 $rmarg 0" "$fname" ""$1".pdf"

# #cleanup the intermediate pdf file (converted.pdf, the one with all the whitespace ;))
# rm "$fname"
