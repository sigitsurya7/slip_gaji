import { useState } from "react";
import { MoreDotIcon } from "../../icons";
import { Dropdown } from "../ui/dropdown/Dropdown";
import { DropdownItem } from "../ui/dropdown/DropdownItem";
import Button from "../ui/button/Button";

export default function WhatsappCard() {

    const [isOpen, setIsOpen] = useState(false);
    
      function toggleDropdown() {
        setIsOpen(!isOpen);
      }
    
      function closeDropdown() {
        setIsOpen(false);
      }

    return(
        <div className="rounded-2xl border border-gray-200 bg-gray-100 dark:border-gray-800 dark:bg-white/[0.03]">
              <div className="px-5 pt-5 bg-white shadow-default rounded-2xl pb-11 dark:bg-gray-900 sm:px-6 sm:pt-6">
                <div className="flex justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
                      WhatsApp Status
                    </h3>
                    <p className="mt-1 text-gray-500 text-theme-sm dark:text-gray-400">
                      Cek koneksi whatsapp kamu di sini!
                    </p>
                  </div>
                  <div className="relative inline-block">
                    <button className="dropdown-toggle" onClick={toggleDropdown}>
                      <MoreDotIcon className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 size-6" />
                    </button>
                    <Dropdown
                      isOpen={isOpen}
                      onClose={closeDropdown}
                      className="w-40 p-2"
                    >
                      <DropdownItem
                        onItemClick={closeDropdown}
                        className="flex w-full font-normal text-left text-gray-500 rounded-lg hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
                      >
                        View More
                      </DropdownItem>
                      <DropdownItem
                        onItemClick={closeDropdown}
                        className="flex w-full font-normal text-left text-gray-500 rounded-lg hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
                      >
                        Delete
                      </DropdownItem>
                    </Dropdown>
                  </div>
                </div>
                <div className="relative ">
                  <div className="max-h-[330px]" id="chartDarkStyle">
                    nanti di sini ada qrcode / klo uda login wa yauda isinya img centang
                  </div>
                </div>
              </div>
        
              <div className="flex items-center justify-center gap-5 px-6 py-3.5 sm:gap-8 sm:py-5">
                <div>
                  <p className="mb-1 text-center text-gray-500 text-theme-xs dark:text-gray-400 sm:text-sm">
                    Kirim Whatsapp
                  </p>
                  <Button>Kirim Whatsapp</Button>
                </div>
              </div>
            </div>
    )
}