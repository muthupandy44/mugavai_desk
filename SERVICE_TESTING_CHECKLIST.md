# Service Module Testing Checklist - Tamil Nadu Shop Workflow

## 🧪 Phase 1: Basic Functionality
- [ ] **Service List Loading**: Verify service orders load correctly from Supabase
- [ ] **Search Functionality**: Test search by customer name, phone, device model
- [ ] **Status Updates**: Test status flow (received → in-progress → ready → delivered)
- [ ] **Delete Functionality**: Test service order deletion with confirmation

## 📝 Phase 2: Form Creation & Persistence
- [ ] **New Service Form**: Open form and verify all fields are present
- [ ] **Form Validation**: Test required field validation (Customer Name, Phone, Device Model)
- [ ] **Auto-Save**: Enter data, navigate away, return - verify draft restored
- [ ] **Draft Restoration**: Verify draft data appears correctly in form fields
- [ ] **Clear Draft**: Test Clear Draft button with confirmation dialog

## 🔄 Phase 3: Navigation & Routing
- [ ] **URL Sync**: Test /service vs /service/new URL routing
- [ ] **Back Navigation**: Test back arrow from form to list
- [ ] **Flicker Prevention**: Verify no loading flicker between list/form views
- [ ] **Breadcrumb Navigation**: Test navigation through app sections

## 🧾 Phase 4: Service Slip Generation
- [ ] **Service Slip Creation**: Create new service order and generate slip
- [ ] **WhatsApp Integration**: Test WhatsApp message generation and sharing
- [ ] **Receipt View**: Verify service slip displays correctly
- [ ] **Final Bill**: Test Complete & Bill functionality for ready items

## 💾 Phase 5: Data Persistence
- [ ] **localStorage Keys**: Verify `mobilemart_repair_draft` key usage
- [ ] **Draft Validation**: Test empty/invalid draft cleanup
- [ ] **State Sync**: Verify React state and localStorage alignment
- [ ] **Error Recovery**: Test corrupted draft handling

## 🎯 Phase 6: Tamil Nadu Shop Specific Workflow
- [ ] **Local Customer Data**: Test with typical Tamil Nadu customer names/phones
- [ ] **Device Models**: Test with common mobile brands in Tamil Nadu market
- [ ] **Service Types**: Verify repair service workflow matches local shop needs
- [ ] **Pricing**: Test estimated cost in Indian Rupees
- [ ] **Language/Date**: Verify Indian date format (DD/MM/YYYY)

## 🔧 Phase 7: Edge Cases
- [ ] **Empty Form**: Test Clear Draft on completely empty form
- [ ] **Partial Data**: Test with only some fields filled
- [ ] **Network Issues**: Test behavior with poor connectivity
- [ ] **Browser Refresh**: Test form state after page refresh
- [ ] **Multiple Tabs**: Test localStorage behavior across browser tabs

## 📱 Phase 8: Mobile/Touch Testing
- [ ] **Touch Targets**: Verify button sizes and touch accessibility
- [ ] **Mobile Layout**: Test on mobile device viewport
- [ ] **Form Input**: Test mobile keyboard behavior
- [ ] **Scroll Behavior**: Test long forms and receipts on mobile

## ✅ Acceptance Criteria
- [ ] All service orders load and display correctly
- [ ] Form saves and restores drafts reliably
- [ ] No loading flicker between views
- [ ] Clear Draft works as expected
- [ ] WhatsApp sharing functions properly
- [ ] Tamil Nadu shop workflow is smooth
- [ ] Mobile experience is responsive and touch-friendly

## 🐛 Known Issues to Watch
- **localStorage Quota**: Monitor storage limits on mobile devices
- **Network Timeouts**: Handle slow Supabase responses
- **Form Validation**: Ensure clear error messages in local context
- **Date Formatting**: Verify Indian date format consistency

## 📝 Testing Notes
```
Test Environment: [Browser/Device]
Test Data: [Sample customer/device info]
Issues Found: [Document any problems]
Performance: [Note any lag/slow issues]
```

## 🚀 Ready for Production Checklist
- [ ] All phases completed successfully
- [ ] No critical bugs found
- [ ] Performance is acceptable
- [ ] Mobile experience is optimized
- [ ] Tamil Nadu workflow validated
