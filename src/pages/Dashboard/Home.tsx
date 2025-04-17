import PageMeta from "../../components/common/PageMeta"
import Button from "../../components/ui/button/Button"
import React, { useRef, useState } from "react"
import * as XLSX from "xlsx"
import { Table, TableBody, TableCell, TableHeader, TableRow } from "../../components/ui/table"
import axios from 'axios';
import toast from "react-hot-toast"
import { RiFileExcel2Line, RiFilePdf2Line, RiWhatsappLine } from "react-icons/ri";

type Pendapatan = { nama: string, jumlah: number }[]
type Potongan = { nama: string, jumlah: number }[]

type SlipState = {
  dataDiri: Record<string, string>
  pendapatan: Pendapatan
  potongan: Potongan
  gaji_bersih: number,
  profile: Record<string, string | number>
}


const groupRowData = (
  columns: string[],
  row: (string | number)[],
  profile: Record<string, string | number>
): SlipState => {
  const pendapatan: Pendapatan = []
  const potongan: Potongan = []
  const dataDiri: Record<string, string> = {}

  const startPendapatan = 5
  const endPendapatan = 10
  const startPotongan = 12
  const endPotongan = 14
  const gajiBersihIndex = 16

  columns.forEach((col, idx) => {
    const key = toKey(col)
    const value = row[idx]

    if (idx >= startPendapatan && idx <= endPendapatan) {
      pendapatan.push({
        'nama': col,
        'jumlah': Number(value)
      })
    } else if (idx >= startPotongan && idx <= endPotongan) {
      potongan.push({
        'nama': col,
        'jumlah': Number(value)
      })
    } else if (idx === gajiBersihIndex) {
      // handled separately
    } else {
      dataDiri[key] = String(value)
    }
  })

  const gaji_bersih = Number(row[gajiBersihIndex])

  return {
    dataDiri,
    pendapatan,
    potongan,
    gaji_bersih,
    profile
  }
}

const toKey = (str: string): string =>
  str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')

export default function Home() {

  const fileInputRef = useRef<HTMLInputElement>(null)
  const [data, setData] = useState<any[]>([])
  const [statusApi, setStatusApi] = useState<any[]>([])
  const [columns, setColumns] = useState<string[]>([])
  const [profile, setProfile] = useState<Record<string, string | number>>({})

  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  const handleImportClick = () => {
    fileInputRef.current?.click()
  }


  const handleExportClick = async () => {
    const allData: SlipState[] = data.map(row => groupRowData(columns, row, profile))
  
    for (const [index, value] of allData.entries()) {
      const nama = value.dataDiri.nama || `Baris ${index + 1}`
      
      try {
        await toast.promise(
          axios.post('http://localhost:3001/generate-pdf', value),
          {
            loading: `⏳ Menggenerate PDF untuk: ${nama}`,
            success: `✅ Berhasil generate PDF: ${nama}`,
            error: `❌ Gagal generate PDF: ${nama}`
          }
        )
        
        setStatusApi(prevState => [
          ...prevState,
          { nama_karyawan: nama, status: '✅ Berhasil membuat pdf' }
        ]) 
      } catch (error) {
        setStatusApi(prevState => [
          ...prevState,
          { nama_karyawan: nama, status: '❌ Gagal membuat pdf' }
        ])
      }
    }

    toast.success("🎉 Semua proses export selesai!")
  }

  const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))
  const handleKirimWhatsApp = async () => {
    const allData: SlipState[] = data.map(row => groupRowData(columns, row, profile))

    for (const [index, value] of allData.entries()) {
      const nama = value.dataDiri.nama || `Baris ${index + 1}`
      const data = {
        nama: value.dataDiri.nama,
        nomor: value.dataDiri.no_whatsapp
      }
      
      try {
        await toast.promise(
          axios.post('http://localhost:3001/send-pdf', data),
          {
            loading: `⏳ Kirim PDF untuk: ${nama}`,
            success: `✅ Berhasil kirim PDF: ${nama}`,
            error: `❌ Gagal kirim PDF: ${nama}`
          }
        )

        setStatusApi(prevState => [
          ...prevState,
          { nama_karyawan: nama, status: '✅ Berhasil mengirim pdf' }
        ])        
      } catch (error) {
        setStatusApi(prevState => [
          ...prevState,
          { nama_karyawan: nama, status: '❌ Gagal mengirim pdf' }
        ])        
      }

      const randomDelay = Math.floor(Math.random() * 4000) + 4000 // 4000 - 8000 ms
      await sleep(randomDelay)
    }

    toast.success("🎉 Semua proses pengiriman selesai!")
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (evt) => {
      const bstr = evt.target?.result
      const workbook = XLSX.read(bstr, { type: "binary" })

      const worksheet = workbook.Sheets[workbook.SheetNames[0]]
      const fullData = XLSX.utils.sheet_to_json(worksheet, { header: 1 })
      
      const header = fullData[6] as string[]
      const content = fullData.slice(8)

      // Profile Tempat Kerja
      const rows = fullData.slice(0, 5) as [string, null, string | number][]
      
      const aliasMap: Record<string, string> = {
        data_gaji_bulan: 'periode'
      }
      
      const meta = rows.reduce<Record<string, string | number>>((acc, row) => {
        const [label, , value] = row
        const originalKey = toKey(label)
        const key = aliasMap[originalKey] || originalKey
        acc[key] = value
        return acc
      }, {})

      const namaIndex = header.findIndex((col) => col?.toString().toLowerCase() === "nama")

      const filteredContent = (content as any[][]).filter((row) => {
        const namaValue = row[namaIndex]
        return namaValue !== undefined && namaValue !== null && namaValue.toString().trim() !== ""
      })            
      
      setProfile(meta)
      setColumns(header)
      setData(filteredContent)
    }
    reader.readAsBinaryString(file)
  }

  const totalPages = Math.ceil(data.length / itemsPerPage)
  const paginatedData = data.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  return (
    <>
      <PageMeta
        title="Kwala Whatsapp Sender Dashboard | Kwala Whatsapp Sender"
        description="Kwala Whatsapp Sender Dashboard"
      />
      <div className="grid grid-cols-12 gap-4 md:gap-6">

        <div className="col-span-12 space-y-6 xl:col-span-8">
          <div className="rounded-2xl border border-gray-200 bg-gray-100 p-4 dark:border-gray-800 dark:bg-white/[0.03]">
            <div className="my-2 flex gap-2 justify-end">
              <input
                type="file"
                accept=".xlsx,.xls,.xlsm"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
              />
              <Button
                size="sm"
                onClick={handleImportClick}
                variant="secondary"
                startIcon={<RiFileExcel2Line className="size-5" />}
              >
                Import Excel
              </Button>
              <Button
                size="sm"
                onClick={handleExportClick}
                variant="primary"
                startIcon={<RiFilePdf2Line className="size-5" />}
              >
                Export PDF
              </Button>
            </div>
            {data.length > 0 ? (
              <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
                <div className="max-w-full overflow-x-auto">
                  <Table>
                    <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                      <TableRow>
                        {columns.map((col, idx) => (
                          <TableCell
                            key={idx}
                            isHeader
                            className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                          >
                            {col}
                          </TableCell>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                      {paginatedData.map((row, idx) => (
                        <TableRow key={idx}>
                          {columns.map((_, colIdx) => (
                            <TableCell key={colIdx} className="px-5 py-4 sm:px-6 text-start text-sm dark:text-gray-400 text-nowrap">
                              {row[colIdx] ?? ""}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                {totalPages > 1 && (
                  <div className="flex justify-between items-center p-4 text-sm text-gray-600 dark:text-gray-300">
                    <div>
                      Page {currentPage} of {totalPages}
                    </div>
                    <div className="space-x-2">
                      <button
                        onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                        disabled={currentPage === 1}
                        className="px-3 py-1 rounded bg-gray-200 dark:bg-gray-700 disabled:opacity-50"
                      >
                        Prev
                      </button>
                      <button
                        onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                        disabled={currentPage === totalPages}
                        className="px-3 py-1 rounded bg-gray-200 dark:bg-gray-700 disabled:opacity-50"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p className="font-semibold text-center text-md my-8 underline underline-offset-1 dark:text-gray-400"> Excel Belum diimport ke dalam sistem </p>
            )}

            {data.length > 0 && (
              <div className="my-4 flex justify-end">
                <Button
                  size="sm"
                  onClick={handleKirimWhatsApp}
                  variant="secondary"
                  startIcon={<RiWhatsappLine className="size-5" />}
                >
                    Kirim WhatsApp
                </Button>
              </div>
            )}
          </div>

        </div>

        <div className="col-span-12 xl:col-span-4">
          <div className="rounded-2xl border border-gray-200 bg-gray-100 p-4 dark:border-gray-800 dark:bg-white/[0.03]">
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
              <div className="max-w-full overflow-x-auto">
                <Table>
                  <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                    <TableRow>
                        <TableCell
                          isHeader
                          className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                        >
                          No
                        </TableCell>
                        <TableCell
                          isHeader
                          className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                        >
                          Nama
                        </TableCell>
                        <TableCell
                          isHeader
                          className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                        >
                          Status
                        </TableCell>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                    {statusApi.length > 0 ? 
                      statusApi.map((value, index) => (
                        <TableRow key={index}>
                          <TableCell
                            className="px-5 py-4 sm:px-6 text-start text-sm dark:text-white"
                          >
                            {index+1}
                          </TableCell>
                          <TableCell
                            className="px-5 py-4 sm:px-6 text-start text-sm dark:text-white"
                          >
                            {value.nama_karyawan}
                          </TableCell>
                          <TableCell
                            className="px-5 py-4 sm:px-6 text-start text-sm dark:text-white"
                          >
                            {value.status}
                          </TableCell>
                        </TableRow>
                      ))
                    : (
                      <TableRow>
                        <TableCell
                          column={3}
                          className="px-5 py-3 font-medium text-gray-500 text-center text-theme-xs dark:text-gray-400 col"
                        >
                          Tidak Ada Data
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
