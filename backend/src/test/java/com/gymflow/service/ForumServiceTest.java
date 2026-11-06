package com.gymflow.service;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class ForumServiceTest {

    @Test
    void khachChiThayTenRutGon() {
        assertThat(ForumService.shortName("Nguyễn Thế Kiên")).isEqualTo("Kiên N.");
        assertThat(ForumService.shortName("  Trần   Huyền ")).isEqualTo("Huyền T.");
        assertThat(ForumService.shortName("Admin")).isEqualTo("Admin");
    }

    @Test
    void trichDoanBoTieuDeVaCatDai() {
        assertThat(ForumService.excerpt("## Nội quy\n- Tôn trọng\n\nnhau")).isEqualTo("Nội quy - Tôn trọng nhau");
        String longBody = "a".repeat(400);
        String ex = ForumService.excerpt(longBody);
        assertThat(ex).hasSizeLessThanOrEqualTo(180).endsWith("…");
    }
}
