# Smart Input Components for Hawaii

## Overview

The KHS CRM includes smart input components specifically optimized for Hawaii-based businesses. These components provide automatic formatting and intelligent autocomplete features.

## Phone Input Component

### Features:
- **Auto-formatting**: Automatically formats phone numbers as (808) 789-7845
- **Type-as-you-go**: Just type digits - formatting happens automatically
- **Clean data storage**: Stores raw 10-digit number in database
- **Natural backspace**: Handles deletion of formatting characters smoothly
- **Paste support**: Handles pasted phone numbers with various formats

### Usage:
```tsx
import { PhoneInput } from '../components/inputs';

<PhoneInput
  value={phoneNumber}
  onChange={(value) => setPhoneNumber(value)}
  placeholder="(808) 789-7845"
/>
```

### Examples:
- Type: `8087897845` → Display: `(808) 789-7845`
- Type: `808789` → Display: `(808) 789`
- Paste: `808-789-7845` → Display: `(808) 789-7845`

## Address Input Component

### Features:
- **Hawaii-specific autocomplete**: Suggests Hawaii cities and ZIP codes
- **Smart parsing**: Recognizes street numbers and types
- **Keyboard navigation**: Use arrow keys to select suggestions
- **All islands covered**: Includes cities from all Hawaiian islands
- **Auto-fills city, state, ZIP**: Complete address from partial input

### Usage:
```tsx
import { AddressInput } from '../components/inputs';

<AddressInput
  value={address}
  onChange={(value) => setAddress(value)}
  onAddressSelect={(addressData) => {
    console.log(addressData);
    // { street, city, state, zipCode, fullAddress }
  }}
  placeholder="350 Ward Ave"
/>
```

### Supported Locations:

**Oahu:**
- Honolulu (96813-96826)
- Pearl City (96782)
- Aiea (96701)
- Kapolei (96707)
- Waipahu (96797)
- Mililani (96789)
- Kailua (96734)
- Kaneohe (96744)
- Ewa Beach (96706)
- Wahiawa (96786)
- Waianae (96792)

**Big Island:**
- Hilo (96720)
- Kailua-Kona (96740, 96745)
- Waimea (96743)
- Pahoa (96778)

**Maui:**
- Kahului (96732)
- Wailuku (96793)
- Kihei (96753)
- Lahaina (96761)

**Kauai:**
- Lihue (96766)
- Kapaa (96746)
- Princeville (96722)

**Molokai:**
- Kaunakakai (96748)

**Lanai:**
- Lanai City (96763)

### Examples:
- Type: `350 Ward Ave` → Suggests: `350 Ward Ave, Honolulu, HI 96814`
- Type: `1234 King St` → Multiple city suggestions
- Type: `567 Ala Moana` → Recognizes boulevard abbreviation

## Implementation in Forms

### Customer Add Form Example:
```tsx
<form onSubmit={handleSubmit}>
  {/* Phone Field */}
  <div>
    <label>Phone</label>
    <PhoneInput
      value={formData.phone}
      onChange={(value) => setFormData({ ...formData, phone: value })}
    />
    <p className="text-xs text-gray-500">
      Just type the numbers - formatting is automatic
    </p>
  </div>

  {/* Address Field */}
  <div>
    <label>Address</label>
    <AddressInput
      value={formData.address}
      onChange={(value) => setFormData({ ...formData, address: value })}
      onAddressSelect={(address) => {
        setFormData({ 
          ...formData, 
          address: address.fullAddress,
          city: address.city,
          state: address.state,
          zipCode: address.zipCode
        });
      }}
    />
    <p className="text-xs text-gray-500">
      Start typing street address - city and zip will auto-complete
    </p>
  </div>
</form>
```

## Benefits for Hawaii Businesses

1. **Local Optimization**: No need to type "Hawaii" or "HI" - it's automatic
2. **Accurate ZIP Codes**: Correct ZIP codes for each city
3. **Faster Data Entry**: Less typing, fewer errors
4. **Mobile Friendly**: Works great on phones and tablets
5. **Professional Appearance**: Consistent formatting across all records

## Testing the Components

A demo page is available at `/smart-inputs-demo` (when added to router) to test all smart input features.

## Future Enhancements

- Island-specific filtering (e.g., only show Oahu cities)
- Business name autocomplete from existing customers
- Validation for Hawaii-specific phone area codes
- Support for P.O. Box formats common in Hawaii
- Military base address support (Pearl Harbor, Schofield, etc.)