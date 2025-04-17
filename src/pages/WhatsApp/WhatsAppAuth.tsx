import { useEffect, useState } from "react";
import axios from "axios";
import PageMeta from "../../components/common/PageMeta";
import Input from "../../components/form/input/InputField";
import Label from "../../components/form/Label";
import TextArea from "../../components/form/input/TextArea";
import Button from "../../components/ui/button/Button";
import { MdOutlineSend } from "react-icons/md"
import toast from "react-hot-toast";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "../../components/ui/table";

const formatDate = (isoDate: string) => {
    const date = new Date(isoDate);
    return date.toLocaleString('id-ID', {
      day: '2-digit',
      month: 'long', // atau '2-digit' kalau mau angka
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

export default function WhatsAppAuth() {
  const [img, setImg] = useState(null);
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);

  const [ form, setForm ] = useState({
    to: '',
    message: ''
  })

  const [data, setData] = useState<any[]>([])

  function getData(){
    axios.get('http://localhost:3001/logs').then((response) => {
        setData(response.data)
    }).catch((error) => {
        console.log(error)
    })
  }

  useEffect(() => {
    const fetchQR = async () => {
      try {
        const res = await axios.get("http://localhost:3001/qr");
        if (res.data.qr) {
          setImg(res.data.qr);
          setSuccess(false);
        } else if (res.data.message === "Sudah terautentikasi") {
          setSuccess(true);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchQR();
    getData()
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prevForm) => ({
      ...prevForm,
      [name]: value,
    }));
  }

  const kirimWa = async () => {
    try {
        await toast.promise(
          axios.post('http://localhost:3001/send-wa', form),
          {
            loading: `⏳ Kirim pesan whatsapp untuk: ${form.to}`,
            success: `✅ Berhasil kirim pesan whatsapp untuk: ${form.to}`,
            error: `❌ Gagal kirim pesan whatsapp untuk: ${form.to}`
          }
        )
    } catch (error) {
        console.log(error)       
    }

    setForm({to: '', message: ''})
    getData()
  }

  return (
    <>
      <PageMeta
        title="Kwala Whatsapp Sender - Auth"
        description="Kwala Whatsapp Sender Auth Page"
      />

      <div className="grid grid-cols-2 gap-4">
        
        <div className="rounded-2xl border border-gray-200 bg-gray-100 p-4 dark:border-gray-800 dark:bg-white/[0.03]">
            <div className="flex items-center justify-center h-full bg-white p-4 rounded-xl border boder-gray-200 dark:border-white/[0.05] dark:bg-white/[0.05]">
                {loading ? (
                <p>Loading...</p>
                ) : success ? (
                <div className="font-semibold text-lg dark:text-gray-400">
                    ✅ Sudah terautentikasi dengan WhatsApp!
                </div>
                ) : img ? (
                <div className="text-center">
                    <p className="mb-4">Scan kode QR di bawah ini dengan WhatsApp:</p>
                    <img src={img} alt="QR Code" className="w-60 h-60 mx-auto" />
                </div>
                ) : (
                <p>QR tidak tersedia atau belum diinisialisasi.</p>
                )}
            </div>
        </div>

        <div className="rounded-2xl border border-gray-200 p-1 h-max bg-gray-100 dark:border-gray-800 dark:bg-white/[0.03]">
            <div className="flex flex-col">
                <div className="space-y-6 bg-white p-4 rounded-2xl border boder-gray-200 dark:border-white/[0.05] dark:bg-white/[0.05]">
                    <div>
                        <Label>
                            Nomor Tlp <span className="text-error-500">*</span>{" "}
                        </Label>
                        <Input placeholder="Cth. 628123456789" type="number" value={form.to} name="to" onChange={handleChange} />
                    </div>
                    <div>
                        <Label>
                            Isi Pesan <span className="text-error-500">*</span>{" "}
                        </Label>
                        <TextArea
                            value={form.message}
                            onChange={(value) => setForm((prevState) => ({...prevState, message: value}))}
                            placeholder="Cth. Hai Apakabar?"
                        />
                    </div>

                </div>
                <div className="flex justify-end p-4">
                    <Button
                        onClick={kirimWa}
                        startIcon={<MdOutlineSend className="size-5" />}
                    >
                        Kirim Pesan~
                    </Button>
                </div>
            </div>
        </div>

        <div className="col-span-2">
            <div className="rounded-2xl border border-gray-200 p-1 h-max bg-gray-100 dark:border-gray-800 dark:bg-white/[0.03]">
                <div className="space-y-6 bg-white p-4 rounded-2xl border boder-gray-200 dark:border-white/[0.05] dark:bg-white/[0.05]">
                    <Table>
                        <TableHeader>
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
                                    Nomor Tujuan
                                </TableCell>
                                <TableCell
                                    isHeader
                                    className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                                >
                                    Pesan
                                </TableCell>
                                <TableCell
                                    isHeader
                                    className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                                >
                                    Tanggal
                                </TableCell>
                                <TableCell
                                    isHeader
                                    className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                                >
                                    Status
                                </TableCell>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {
                                data.map((value, index) => (
                                    <TableRow key={index}>
                                        <TableCell
                                            className="px-5 py-4 sm:px-6 text-start text-sm dark:text-gray-400"
                                        >
                                            {index+1}
                                        </TableCell>
                                        <TableCell
                                            className="px-5 py-4 sm:px-6 text-start text-sm dark:text-gray-400"
                                        >
                                            {value.to}
                                        </TableCell>
                                        <TableCell
                                            className="px-5 py-4 sm:px-6 text-start text-sm dark:text-gray-400"
                                        >
                                            {value.message}
                                        </TableCell>
                                        <TableCell
                                            className="px-5 py-4 sm:px-6 text-start text-sm dark:text-gray-400"
                                        >
                                            {formatDate(value.timestamp)}
                                        </TableCell>
                                        <TableCell
                                            className="px-5 py-4 sm:px-6 text-start text-sm dark:text-gray-400"
                                        >
                                            {value.status == 'failed' ? '❌ Gagal' : '✅ Berhasil' }
                                        </TableCell>
                                    </TableRow>
                                ))
                            }
                        </TableBody>
                    </Table>
                </div>
            </div>
        </div>
      </div>
    </>
  );
}
