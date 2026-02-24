import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

export interface Filters {
  priceRanges: string[];
  districts: string[];
  categories: string[];
}

interface FilterSidebarProps {
  filters: Filters;
  onFilterChange: (newFilters: Filters) => void;
}

const districtOptions = [
  "Quận 1", "Quận 2", "Quận 3", "Quận 4", "Quận 5",
  "Quận 6", "Quận 7", "Quận 8", "Quận 10", "Quận 11", "Quận 12",
  "Bình Thạnh", "Phú Nhuận", "Gò Vấp", "Tân Bình", "Tân Phú",
  "Thủ Đức",
];

const categoryOptions = [
  "Nhà hàng", "Quán ăn", "Café", "Trà sữa", "Bar/Pub", "Ăn vặt/Vỉa hè",
];

const priceRangeOptions = [
  { id: 'price-1', label: 'Dưới 200.000đ', value: '$' },
  { id: 'price-2', label: '200.000đ - 500.000đ', value: '$$' },
  { id: 'price-3', label: '500.000đ - 1.000.000đ', value: '$$$' },
  { id: 'price-4', label: 'Trên 1.000.000đ', value: '$$$$' },
];

export function FilterSidebar({ filters, onFilterChange }: FilterSidebarProps) {
  const handleToggle = (key: keyof Filters, value: string, checked: boolean) => {
    const current = filters[key];
    const updated = checked
      ? [...current, value]
      : current.filter((v) => v !== value);
    onFilterChange({ ...filters, [key]: updated });
  };

  const activeFilterCount = filters.priceRanges.length + filters.districts.length + filters.categories.length;

  const handleClearAll = () => {
    onFilterChange({ priceRanges: [], districts: [], categories: [] });
  };

  return (
    <aside className="w-full lg:w-72 xl:w-80 lg:sticky top-16 h-auto lg:h-[calc(100vh-4rem)] border-b lg:border-b-0 lg:border-r">
      <div className="p-4 h-full overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Bộ lọc</h3>
          {activeFilterCount > 0 && (
            <Button variant="ghost" size="sm" onClick={handleClearAll} className="text-muted-foreground hover:text-destructive">
              <X className="h-4 w-4 mr-1" />
              Xóa ({activeFilterCount})
            </Button>
          )}
        </div>
        <Accordion type="multiple" defaultValue={["Loại hình", "Mức giá", "Khu vực"]} className="w-full">
          <AccordionItem value="Loại hình">
            <AccordionTrigger>Loại hình</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-2">
                {categoryOptions.map((option) => (
                  <div key={option} className="flex items-center space-x-2">
                    <Checkbox
                      id={`category-${option}`}
                      checked={filters.categories.includes(option)}
                      onCheckedChange={(checked) => handleToggle('categories', option, !!checked)}
                    />
                    <Label htmlFor={`category-${option}`} className="font-normal cursor-pointer">
                      {option}
                    </Label>
                  </div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="Mức giá">
            <AccordionTrigger>Mức giá</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-2 pt-2">
                {priceRangeOptions.map((option) => (
                  <div key={option.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={option.id}
                      checked={filters.priceRanges.includes(option.value)}
                      onCheckedChange={(checked) => handleToggle('priceRanges', option.value, !!checked)}
                    />
                    <Label htmlFor={option.id} className="font-normal cursor-pointer">
                      {option.label}
                    </Label>
                  </div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="Khu vực">
            <AccordionTrigger>Khu vực (Quận)</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-2">
                {districtOptions.map((option) => (
                  <div key={option} className="flex items-center space-x-2">
                    <Checkbox
                      id={`district-${option}`}
                      checked={filters.districts.includes(option)}
                      onCheckedChange={(checked) => handleToggle('districts', option, !!checked)}
                    />
                    <Label htmlFor={`district-${option}`} className="font-normal cursor-pointer">
                      {option}
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
