package service

import (
	"bytes"
	"encoding/binary"
	"fmt"
	"hash/crc32"
	"os"
)

// sanitizeImage strips metadata from an image file while preserving pixel data quality.
//
// SECURITY: Removes privacy-sensitive metadata (EXIF/GPS/XMP/IPTC/ICC profiles)
// at the byte level without re-encoding, so there is zero quality degradation.
//
// Supported formats:
//   - JPEG: strips APP1 (EXIF), APP2 (ICC), APP13 (IPTC), COM (comments)
//   - PNG:  keeps only critical chunks (IHDR, PLTE, tRNS, IDAT, IEND)
//   - GIF:  strips comment extensions and non-essential application extensions
//   - WebP: strips EXIF, XMP, ICCP chunks from the RIFF container
func sanitizeImage(inPath, outPath, format string) error {
	switch format {
	case "jpeg":
		return sanitizeJPEG(inPath, outPath)
	case "png":
		return sanitizePNG(inPath, outPath)
	case "gif":
		return sanitizeGIF(inPath, outPath)
	case "webp":
		return sanitizeWebP(inPath, outPath)
	default:
		return fmt.Errorf("unsupported format for sanitization: %s", format)
	}
}

// ---------------------------------------------------------------------------
// JPEG sanitizer
// ---------------------------------------------------------------------------

// JPEG marker bytes.
const (
	jpegMarkerPrefix = 0xFF
	jpegSOI          = 0xD8
	jpegEOI          = 0xD9
	jpegSOS          = 0xDA
	jpegAPP0         = 0xE0 // JFIF
	jpegAPP1         = 0xE1 // EXIF / XMP
	jpegAPP2         = 0xE2 // ICC Profile
	jpegAPP13        = 0xED // IPTC / Photoshop
	jpegAPP14        = 0xEE // Adobe
	jpegCOM          = 0xFE // Comment
)

// jpegMetadataMarkers contains markers that carry metadata to strip.
var jpegMetadataMarkers = map[byte]bool{
	jpegAPP1:  true, // EXIF, XMP
	jpegAPP2:  true, // ICC profile
	jpegAPP13: true, // IPTC
	jpegAPP14: true, // Adobe
	jpegCOM:   true, // Comment
}

// sanitizeJPEG copies a JPEG file while stripping metadata segments.
//
// JPEG structure: SOI, then a series of marker segments (each: 0xFF + marker byte
// + 2-byte big-endian length + payload), ending with SOS + compressed data + EOI.
// We copy every segment except the metadata markers listed above.
func sanitizeJPEG(inPath, outPath string) error {
	data, err := os.ReadFile(inPath)
	if err != nil {
		return fmt.Errorf("read jpeg: %w", err)
	}
	if len(data) < 2 || data[0] != jpegMarkerPrefix || data[1] != jpegSOI {
		return fmt.Errorf("not a valid JPEG file")
	}

	var out bytes.Buffer
	out.Grow(len(data))

	// Write SOI.
	out.Write(data[:2])
	pos := 2

	for pos < len(data)-1 {
		// Find next marker (0xFF followed by non-0x00 byte).
		if data[pos] != jpegMarkerPrefix {
			return fmt.Errorf("expected JPEG marker at offset %d, got 0x%02X", pos, data[pos])
		}

		// Skip padding 0xFF bytes.
		for pos < len(data)-1 && data[pos+1] == jpegMarkerPrefix {
			pos++
		}
		if pos >= len(data)-1 {
			break
		}

		marker := data[pos+1]

		// SOS: everything after SOS header until EOI is compressed image data.
		// Copy the rest verbatim.
		if marker == jpegSOS {
			out.Write(data[pos:])
			return writeFileAtomic(outPath, out.Bytes())
		}

		// EOI: end of image.
		if marker == jpegEOI {
			out.Write(data[pos : pos+2])
			return writeFileAtomic(outPath, out.Bytes())
		}

		// Standalone markers (no length field): RST0-RST7 (0xD0-0xD7), SOI, EOI, TEM.
		if (marker >= 0xD0 && marker <= 0xD7) || marker == 0x01 {
			out.Write(data[pos : pos+2])
			pos += 2
			continue
		}

		// Segment with length: 2 bytes marker + 2 bytes length + payload.
		if pos+4 > len(data) {
			return fmt.Errorf("truncated JPEG segment at offset %d", pos)
		}
		segLen := int(binary.BigEndian.Uint16(data[pos+2 : pos+4]))
		segEnd := pos + 2 + segLen // marker(2) is before length; length includes its own 2 bytes.
		if segEnd > len(data) {
			return fmt.Errorf("JPEG segment length exceeds file at offset %d", pos)
		}

		if jpegMetadataMarkers[marker] {
			// Skip this metadata segment.
			pos = segEnd
			continue
		}

		// Keep this segment.
		out.Write(data[pos:segEnd])
		pos = segEnd
	}

	return writeFileAtomic(outPath, out.Bytes())
}

// ---------------------------------------------------------------------------
// PNG sanitizer
// ---------------------------------------------------------------------------

// pngCriticalChunks lists chunks that must be preserved for the image to render.
var pngCriticalChunks = map[string]bool{
	"IHDR": true,
	"PLTE": true,
	"IDAT": true,
	"IEND": true,
	"tRNS": true, // Transparency — essential for alpha in palette-based PNGs.
}

// sanitizePNG copies a PNG file keeping only critical chunks.
//
// PNG structure: 8-byte signature, then chunks each consisting of:
//
//	4 bytes data length (big-endian)
//	4 bytes chunk type
//	<length> bytes data
//	4 bytes CRC32
//
// We preserve the signature and only the critical chunks listed above,
// stripping tEXt, iTXt, zTXt, eXIf, iCCP, cHRM, gAMA, sBIT, sRGB,
// tIME, pHYs, sPLT, hIST, bKGD, and any other ancillary chunks.
func sanitizePNG(inPath, outPath string) error {
	data, err := os.ReadFile(inPath)
	if err != nil {
		return fmt.Errorf("read png: %w", err)
	}

	// PNG signature: 137 80 78 71 13 10 26 10.
	pngSig := []byte{0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A}
	if len(data) < 8 || !bytes.Equal(data[:8], pngSig) {
		return fmt.Errorf("not a valid PNG file")
	}

	var out bytes.Buffer
	out.Grow(len(data))
	out.Write(pngSig)

	pos := 8
	for pos+12 <= len(data) { // minimum chunk: 4 (len) + 4 (type) + 0 (data) + 4 (crc) = 12
		chunkLen := int(binary.BigEndian.Uint32(data[pos : pos+4]))
		chunkType := string(data[pos+4 : pos+8])
		chunkTotal := 4 + 4 + chunkLen + 4 // len + type + data + crc

		if pos+chunkTotal > len(data) {
			return fmt.Errorf("truncated PNG chunk %q at offset %d", chunkType, pos)
		}

		if pngCriticalChunks[chunkType] {
			out.Write(data[pos : pos+chunkTotal])
		}

		pos += chunkTotal

		if chunkType == "IEND" {
			break
		}
	}

	return writeFileAtomic(outPath, out.Bytes())
}

// ---------------------------------------------------------------------------
// GIF sanitizer
// ---------------------------------------------------------------------------

// sanitizeGIF copies a GIF file while stripping comment extensions and
// non-essential application extensions (preserving NETSCAPE2.0 for animation loops).
//
// GIF structure:
//
//	Header (GIF87a/GIF89a) — 6 bytes
//	Logical Screen Descriptor — 7 bytes
//	[Global Color Table] — if present
//	Extensions and image blocks:
//	  Extension Introducer: 0x21
//	    0xF9 = Graphic Control Extension
//	    0xFE = Comment Extension (STRIP)
//	    0xFF = Application Extension (STRIP unless NETSCAPE2.0)
//	    0x01 = Plain Text Extension (STRIP)
//	  Image Separator: 0x2C + image descriptor + data
//	Trailer: 0x3B
func sanitizeGIF(inPath, outPath string) error {
	data, err := os.ReadFile(inPath)
	if err != nil {
		return fmt.Errorf("read gif: %w", err)
	}

	if len(data) < 13 {
		return fmt.Errorf("not a valid GIF file")
	}
	sig := string(data[:6])
	if sig != "GIF87a" && sig != "GIF89a" {
		return fmt.Errorf("not a valid GIF file: bad signature %q", sig)
	}

	var out bytes.Buffer
	out.Grow(len(data))

	// Copy header + Logical Screen Descriptor.
	out.Write(data[:13])
	pos := 13

	// Global Color Table.
	packed := data[10]
	hasGCT := packed&0x80 != 0
	if hasGCT {
		gctSize := 3 * (1 << ((packed & 0x07) + 1))
		if pos+gctSize > len(data) {
			return fmt.Errorf("truncated GIF global color table")
		}
		out.Write(data[pos : pos+gctSize])
		pos += gctSize
	}

	for pos < len(data) {
		switch data[pos] {
		case 0x3B: // Trailer.
			out.WriteByte(0x3B)
			return writeFileAtomic(outPath, out.Bytes())

		case 0x2C: // Image Descriptor.
			if pos+10 > len(data) {
				return fmt.Errorf("truncated GIF image descriptor")
			}
			out.Write(data[pos : pos+10])
			pos += 10

			// Local Color Table.
			imgPacked := data[pos-1]
			hasLCT := imgPacked&0x80 != 0
			if hasLCT {
				lctSize := 3 * (1 << ((imgPacked & 0x07) + 1))
				if pos+lctSize > len(data) {
					return fmt.Errorf("truncated GIF local color table")
				}
				out.Write(data[pos : pos+lctSize])
				pos += lctSize
			}

			// LZW Minimum Code Size.
			if pos >= len(data) {
				return fmt.Errorf("truncated GIF image data")
			}
			out.WriteByte(data[pos])
			pos++

			// Sub-blocks.
			pos, err = copyGIFSubBlocks(data, pos, &out)
			if err != nil {
				return err
			}

		case 0x21: // Extension.
			if pos+2 > len(data) {
				return fmt.Errorf("truncated GIF extension")
			}
			label := data[pos+1]

			switch label {
			case 0xF9: // Graphic Control Extension — keep.
				out.Write(data[pos : pos+2])
				pos += 2
				pos, err = copyGIFSubBlocks(data, pos, &out)
				if err != nil {
					return err
				}

			case 0xFF: // Application Extension — keep only NETSCAPE2.0.
				// Read the extension to check its identifier.
				start := pos
				pos += 2
				keep := false
				if pos < len(data) {
					blockSize := int(data[pos])
					if blockSize == 11 && pos+1+11 <= len(data) {
						appID := string(data[pos+1 : pos+1+11])
						if appID == "NETSCAPE2.0" || appID == "ANIMEXTS1.0" {
							keep = true
						}
					}
				}
				if keep {
					out.Write(data[start : start+2])
					pos = start + 2
					pos, err = copyGIFSubBlocks(data, pos, &out)
					if err != nil {
						return err
					}
				} else {
					pos = start + 2
					pos, err = skipGIFSubBlocks(data, pos)
					if err != nil {
						return err
					}
				}

			case 0xFE, 0x01: // Comment Extension, Plain Text Extension — strip.
				pos += 2
				pos, err = skipGIFSubBlocks(data, pos)
				if err != nil {
					return err
				}

			default: // Unknown extension — skip for safety.
				pos += 2
				pos, err = skipGIFSubBlocks(data, pos)
				if err != nil {
					return err
				}
			}

		default:
			return fmt.Errorf("unexpected GIF block type 0x%02X at offset %d", data[pos], pos)
		}
	}

	// Missing trailer — write one.
	out.WriteByte(0x3B)
	return writeFileAtomic(outPath, out.Bytes())
}

// copyGIFSubBlocks copies GIF sub-blocks from data[pos] into out.
// Returns the new position after the terminating zero-length sub-block.
func copyGIFSubBlocks(data []byte, pos int, out *bytes.Buffer) (int, error) {
	for pos < len(data) {
		blockLen := int(data[pos])
		out.WriteByte(data[pos])
		pos++
		if blockLen == 0 {
			return pos, nil
		}
		if pos+blockLen > len(data) {
			return 0, fmt.Errorf("truncated GIF sub-block at offset %d", pos)
		}
		out.Write(data[pos : pos+blockLen])
		pos += blockLen
	}
	return 0, fmt.Errorf("unterminated GIF sub-blocks")
}

// skipGIFSubBlocks skips GIF sub-blocks starting at data[pos].
// Returns the new position after the terminating zero-length sub-block.
func skipGIFSubBlocks(data []byte, pos int) (int, error) {
	for pos < len(data) {
		blockLen := int(data[pos])
		pos++
		if blockLen == 0 {
			return pos, nil
		}
		pos += blockLen
		if pos > len(data) {
			return 0, fmt.Errorf("truncated GIF sub-block at offset %d", pos)
		}
	}
	return 0, fmt.Errorf("unterminated GIF sub-blocks")
}

// ---------------------------------------------------------------------------
// WebP sanitizer
// ---------------------------------------------------------------------------

// webpChunksToStrip contains RIFF chunk types that carry metadata.
var webpChunksToStrip = map[string]bool{
	"EXIF": true,
	"XMP ": true,
	"ICCP": true,
}

// sanitizeWebP copies a WebP file while stripping EXIF, XMP, and ICC chunks.
//
// WebP is a RIFF container:
//
//	"RIFF" + 4 bytes file size (LE) + "WEBP"
//	Then a series of chunks: 4 bytes type + 4 bytes size (LE) + data [+ 1 pad byte if odd]
//
// We also update the VP8X flags byte to clear the EXIF, XMP, and ICC flags.
func sanitizeWebP(inPath, outPath string) error {
	data, err := os.ReadFile(inPath)
	if err != nil {
		return fmt.Errorf("read webp: %w", err)
	}

	if len(data) < 12 {
		return fmt.Errorf("not a valid WebP file")
	}
	if string(data[0:4]) != "RIFF" || string(data[8:12]) != "WEBP" {
		return fmt.Errorf("not a valid WebP file")
	}

	var out bytes.Buffer
	out.Grow(len(data))

	// Write placeholder RIFF header; we'll patch the size at the end.
	out.Write(data[:12])

	pos := 12
	for pos+8 <= len(data) {
		chunkType := string(data[pos : pos+4])
		chunkSize := int(binary.LittleEndian.Uint32(data[pos+4 : pos+8]))
		chunkTotal := 8 + chunkSize
		if chunkSize%2 == 1 {
			chunkTotal++ // RIFF padding byte for odd-sized chunks.
		}
		if pos+chunkTotal > len(data) {
			// Allow the last chunk to be slightly truncated at EOF.
			chunkTotal = len(data) - pos
		}

		if webpChunksToStrip[chunkType] {
			pos += chunkTotal
			continue
		}

		// VP8X extended header: clear metadata-related flags.
		if chunkType == "VP8X" && chunkSize >= 4 {
			chunkData := make([]byte, chunkTotal)
			copy(chunkData, data[pos:pos+chunkTotal])
			flags := chunkData[8]
			flags &^= 0x20 // Clear ICCP flag (bit 5)
			flags &^= 0x08 // Clear XMP flag (bit 3)
			flags &^= 0x04 // Clear EXIF flag (bit 2)
			chunkData[8] = flags
			out.Write(chunkData)
			pos += chunkTotal
			continue
		}

		out.Write(data[pos : pos+chunkTotal])
		pos += chunkTotal
	}

	// Patch RIFF file size (total size minus 8 for "RIFF" + size field).
	result := out.Bytes()
	binary.LittleEndian.PutUint32(result[4:8], uint32(len(result)-8))

	return writeFileAtomic(outPath, result)
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

// writeFileAtomic writes data to a temporary file and renames it to outPath.
func writeFileAtomic(outPath string, data []byte) error {
	tmp := outPath + ".tmp"
	if err := os.WriteFile(tmp, data, 0o644); err != nil {
		return fmt.Errorf("write tmp: %w", err)
	}
	if err := os.Rename(tmp, outPath); err != nil {
		os.Remove(tmp)
		return fmt.Errorf("rename: %w", err)
	}
	return nil
}

// pngCRC32 calculates the CRC32 for a PNG chunk (type + data).
// This is exported for testing but is unused in normal sanitization
// because we copy existing CRC bytes verbatim from the source.
var _ = pngCRC32 // suppress unused warning; available for tests.

func pngCRC32(chunkType string, data []byte) uint32 {
	h := crc32.NewIEEE()
	h.Write([]byte(chunkType))
	h.Write(data)
	return h.Sum32()
}
