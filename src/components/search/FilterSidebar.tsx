import * as React from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

interface Filters {
  priceRanges: string[];
}

interface FilterSidebarProps {
  filters: Filters;
  onFilterChange: (newFilters: Filters) => void;
}

const filterSections = {
  "Loại hình": ["Nhà hàng", "Quán ăn", "Café", "Trà sữa", "Bar/Pub", "Ăn vặt/Vỉa hè"],
  "Khu vực (Quận)": ["Quận 1", "Quận 2", "Quận 3", "Quận 4", "Quận 5", "Bình Thạnh", "Phú Nhuận"],
  "Ẩm thực": ["Món Việt", "Món Hoa", "Món Nhật", "Món Hàn", "Món Âu", "Fusion"],
  "Tiện ích": ["Có chỗ đậu xe hơi", "Cho phép thú cưng", "Có khu vui chơi trẻ em", "View đẹp", "Có phòng riêng"],
  "Phù hợp cho": ["Hẹn hò", "Gia đình", "Bạn bè", "Tiếp khách", "Làm việc", "Một mình"],
};

const priceRangeOptions = [
  { id: 'price-1', label: 'Dưới 200.000đ', value: '$' },
  { id: 'price-2', label: '200.000đ - 500.000đ', value: '$$' },
  { id: 'price-3', label: '500.000đ - 1.000.000đ', value: '$$$' },
  { id: 'price-4', label: 'Trên 1.000.000đ', value: '$$$$' },
];

export function FilterSidebar({ filters, onFilterChange }: FilterSidebarProps) {
  const handlePriceChange = (checked: boolean, value: string) => {
    const newPriceRanges = checked
      ? [...filters.priceRanges, value]
      : filters.priceRanges.filter((p) => p !== value);
    onFilterChange({ ...filters, priceRanges: newPriceRanges });
  };

  return (
    <aside className="w-full lg:w-72 xl:w-80 lg:sticky top-16 h-auto lg:h-[calc(100vh-4rem)] border-b lg:border-b-0 lg:border-r">
      <div className="p-4 h-full overflow-y-auto">
        <h3 className="text-lg font-semibold mb-4">Bộ lọc</h3>
        <Accordion type="multiple" defaultValue={["Loại hình", "Mức giá"]} className="w-full">
          {Object.entries(filterSections).map(([title, options]) => (
            <AccordionItem value={title} key={title}>
              <AccordionTrigger>{title}</AccordionTrigger>
              <AccordionContent>
                <div className="space-y-2">
                  {options.map((option) => (
                    <div key={option} className="flex items-center space-x-2">
                      <Checkbox id={`${title}-${option}`} />
                      <Label htmlFor={`${title}-${option}`} className="font-normal cursor-pointer">
                        {option}
                      </Label>
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
          <AccordionItem value="Mức giá">
            <AccordionTrigger>Mức giá</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-2 pt-2">
                {priceRangeOptions.map((option) => (
                  <div key={option.id} className="flex items-center space-x-2">
                    <Checkbox 
                      id={option.id} 
                      checked={filters.priceRanges.includes(option.value)}
                      onCheckedChange={(checked) => handlePriceChange(!!checked, option.value)}
                    />
                    <Label htmlFor={option.id} className="font-normal cursor-pointer">
                      {option.label}
                    </Label>
                  </div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </aside>
  );
}