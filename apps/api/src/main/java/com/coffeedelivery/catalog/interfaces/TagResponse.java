package com.coffeedelivery.catalog.interfaces;

import com.coffeedelivery.catalog.domain.Tag;

record TagResponse(String slug, String name) {

  static TagResponse from(Tag tag) {
    return new TagResponse(tag.slug(), tag.name());
  }
}
