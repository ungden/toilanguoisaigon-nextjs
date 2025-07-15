import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { PlusCircle, Trash2, Loader2, Search } from 'lucide-react';
import { useAdminSearchLocations } from '@/hooks/data/useAdminSearchLocations';
import { useAddLocationToCollection } from '@/hooks/data/useAddLocationToCollection';
import { useRemoveLocationFromCollection } from '@/hooks/data/useRemoveLocationFromCollection';
import { Location } from '@/types/database';

interface ManageCollectionLocationsProps {
  collectionId: number;
  currentLocations: Location[];
}

export function ManageCollectionLocations({ collectionId, currentLocations }: ManageCollectionLocationsProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const { data: searchResults, isLoading: isSearching } = useAdminSearchLocations(searchTerm);
  const addLocationMutation = useAddLocationToCollection();
  const removeLocationMutation = useRemoveLocationFromCollection();

  const handleRemoveLocation = (locationId: string) => {
    removeLocationMutation.mutate({ collectionId, locationId });
  };

  const handleAddLocation = (locationId: string) => {
    addLocationMutation.mutate({ collectionId, locationId });
  };

  const filteredSearchResults = searchResults?.filter(
    (result) => !currentLocations.some((current) => current.id === result.id)
  );

  return (
    <div className="space-y-4 pt-4">
      <Separator />
      <h3 className="text-lg font-medium">Quản lý Địa điểm trong Bộ sưu tập</h3>
      
      {/* Current Locations */}
      <div>
        <h4 className="text-sm font-medium text-muted-foreground mb-2">Địa điểm hiện tại ({currentLocations.length})</h4>
        <ScrollArea className="h-48 rounded-md border p-2">
          {currentLocations.length > 0 ? (
            <div className="space-y-2">
              {currentLocations.map((location) => (
                <div key={location.id} className="flex items-center justify-between p-2 rounded hover:bg-muted">
                  <div>
                    <p className="font-medium">{location.name}</p>
                    <p className="text-xs text-muted-foreground">{location.district}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={() => handleRemoveLocation(location.id)}
                    disabled={removeLocationMutation.isPending}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center p-4">Chưa có địa điểm nào trong bộ sưu tập này.</p>
          )}
        </ScrollArea>
      </div>

      {/* Add New Location */}
      <div>
        <h4 className="text-sm font-medium text-muted-foreground mb-2">Thêm địa điểm mới</h4>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Tìm kiếm địa điểm để thêm..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <ScrollArea className="h-48 rounded-md border mt-2 p-2">
          {isSearching && <Loader2 className="mx-auto my-4 h-6 w-6 animate-spin text-muted-foreground" />}
          {!isSearching && filteredSearchResults && filteredSearchResults.length > 0 && (
            <div className="space-y-2">
              {filteredSearchResults.map((location) => (
                <div key={location.id} className="flex items-center justify-between p-2 rounded hover:bg-muted">
                  <div>
                    <p className="font-medium">{location.name}</p>
                    <p className="text-xs text-muted-foreground">{location.district}</p>
                  </div>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handleAddLocation(location.id)}
                    disabled={addLocationMutation.isPending}
                  >
                    <PlusCircle className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
          {!isSearching && searchTerm.length > 1 && (!filteredSearchResults || filteredSearchResults.length === 0) && (
             <p className="text-sm text-muted-foreground text-center p-4">Không tìm thấy địa điểm nào.</p>
          )}
        </ScrollArea>
      </div>
    </div>
  );
}