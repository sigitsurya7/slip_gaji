!include "MUI2.nsh"

!define MUI_HEADERIMAGE
!define MUI_HEADERIMAGE_BITMAP "public/logo.bmp"
!define MUI_HEADERIMAGE_RIGHT

!macro customHeader
  ; Kosongin aja kalau sudah define di atas
!macroend

!macro customInit
  MessageBox MB_OK|MB_ICONINFORMATION "Terima kasih telah menginstal Kwala Sender! 🚀"
!macroend