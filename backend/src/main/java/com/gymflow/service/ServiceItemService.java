package com.gymflow.service;

import com.gymflow.common.ApiException;
import com.gymflow.domain.ServiceItem;
import com.gymflow.dto.Dtos.ServiceItemRequest;
import com.gymflow.dto.Dtos.ServiceItemResponse;
import com.gymflow.repository.ServiceItemRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ServiceItemService {

    private final ServiceItemRepository serviceItemRepository;
    private final AuditService auditService;
    private final Mappers mappers;

    @Transactional(readOnly = true)
    public List<ServiceItemResponse> listActive() {
        return serviceItemRepository.findByActiveTrueOrderByNameAsc()
                .stream().map(mappers::serviceItem).toList();
    }

    @Transactional(readOnly = true)
    public List<ServiceItemResponse> listAll() {
        return serviceItemRepository.findAllByOrderByNameAsc()
                .stream().map(mappers::serviceItem).toList();
    }

    @Transactional(readOnly = true)
    public ServiceItem get(Long id) {
        return serviceItemRepository.findById(id)
                .orElseThrow(() -> ApiException.notFound("dịch vụ"));
    }

    @Transactional
    public ServiceItemResponse create(ServiceItemRequest req) {
        String name = req.name().trim();
        if (serviceItemRepository.existsByNameIgnoreCase(name)) {
            throw ApiException.conflict("Tên dịch vụ đã tồn tại trong hệ thống");
        }
        ServiceItem s = new ServiceItem();
        s.setName(name);
        s.setCategory(req.category());
        s.setDescription(Mappers.blankToNull(req.description()));
        s.setUnitPrice(req.unitPrice());
        s.setRequiresBooking(req.requiresBooking());
        s.setOpeningNote(Mappers.blankToNull(req.openingNote()));
        s.setActive(req.active() == null || req.active());
        s.setCreatedAt(LocalDateTime.now());
        serviceItemRepository.save(s);
        auditService.log("SERVICE_CREATE", "SERVICE", s.getId(), s.getName() + " · " + s.getCategory());
        return mappers.serviceItem(s);
    }

    @Transactional
    public ServiceItemResponse update(Long id, ServiceItemRequest req) {
        ServiceItem s = get(id);
        String name = req.name().trim();
        if (serviceItemRepository.existsByNameIgnoreCaseAndIdNot(name, id)) {
            throw ApiException.conflict("Tên dịch vụ đã tồn tại trong hệ thống");
        }
        s.setName(name);
        s.setCategory(req.category());
        s.setDescription(Mappers.blankToNull(req.description()));
        s.setUnitPrice(req.unitPrice());
        s.setRequiresBooking(req.requiresBooking());
        s.setOpeningNote(Mappers.blankToNull(req.openingNote()));
        if (req.active() != null) {
            s.setActive(req.active());
        }
        auditService.log("SERVICE_UPDATE", "SERVICE", s.getId(), s.getName());
        return mappers.serviceItem(s);
    }

    @Transactional
    public ServiceItemResponse toggleActive(Long id, boolean active) {
        ServiceItem s = get(id);
        s.setActive(active);
        auditService.log("SERVICE_TOGGLE_ACTIVE", "SERVICE", s.getId(), s.getName() + " → active=" + active);
        return mappers.serviceItem(s);
    }
}
