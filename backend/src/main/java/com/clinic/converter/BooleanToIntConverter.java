package com.clinic.converter;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

/**
 * JPA converter: Boolean <-> INTEGER (0 / 1)
 * SQLite has no native BOOLEAN type; the original schema uses INTEGER DEFAULT 0.
 */
@Converter
public class BooleanToIntConverter implements AttributeConverter<Boolean, Integer> {

    @Override
    public Integer convertToDatabaseColumn(Boolean value) {
        return (value != null && value) ? 1 : 0;
    }

    @Override
    public Boolean convertToEntityAttribute(Integer value) {
        return value != null && value == 1;
    }
}
